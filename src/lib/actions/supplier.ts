"use server";

import { revalidatePath } from "next/cache";
import { mergeUnitCost } from "@/lib/admin/supplies-inventory";
import { sumVariantQuantities } from "@/lib/catalog/product-stock";
import { getWalletLedger } from "@/lib/data/wallet";
import {
  addSupplyBox,
  addSupplyItem,
  updateSupplyEntry,
} from "@/lib/actions/supplies-inventory";
import { recordProductPurchase } from "@/lib/actions/wallet";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type SupplierActionResult = {
  success: boolean;
  message: string;
};

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; result: SupplierActionResult }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      result: { success: false, message: "Supabase is not configured." },
    };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        ok: false,
        result: { success: false, message: "Sign in required." },
      };
    }
    if (isMasterAdminEmail(user.email)) {
      return { ok: true, userId: user.id };
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    if (!isMasterAdmin(profile)) {
      return {
        ok: false,
        result: {
          success: false,
          message: "Master admin access required.",
        },
      };
    }
    return { ok: true, userId: user.id };
  } catch {
    return {
      ok: false,
      result: { success: false, message: "Unable to verify admin access." },
    };
  }
}

async function getSpendableBalance(): Promise<number> {
  const ledger = await getWalletLedger("all");
  return ledger.summary.netIncome;
}

function money(n: number) {
  return Math.round(Math.max(0, n) * 100) / 100;
}

async function assertAffordable(
  totalCost: number,
): Promise<SupplierActionResult | null> {
  if (totalCost <= 0) {
    return { success: false, message: "Enter a purchase cost greater than zero." };
  }
  const balance = await getSpendableBalance();
  if (totalCost > balance) {
    return {
      success: false,
      message: `Insufficient balance. Need $${totalCost.toFixed(2)} but wallet has $${balance.toFixed(2)}.`,
    };
  }
  return null;
}

/** Buy product stock with wallet balance — raises qty, weighted cost, and journals a debit. */
export async function purchaseProductFromSupplier(input: {
  productId: string;
  qty: number;
  totalCost: number;
}): Promise<SupplierActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const qty = Math.floor(Number(input.qty));
  const totalCost = money(Number(input.totalCost) || 0);
  if (!Number.isFinite(qty) || qty < 1) {
    return { success: false, message: "Enter a quantity of at least 1." };
  }
  const afford = await assertAffordable(totalCost);
  if (afford) return afford;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id, name, sku, inventory_quantity, cost, metadata")
      .eq("id", input.productId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return { success: false, message: "Product not found." };
    }

    const metadata: Record<string, unknown> =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};

    const priorQty = Math.max(0, Number(existing.inventory_quantity) || 0);
    let nextQty = priorQty + qty;

    if (metadata.hasMultipleSizes === true && Array.isArray(metadata.variants)) {
      const variants = metadata.variants.map((item) => {
        if (!item || typeof item !== "object") return item;
        return { ...(item as Record<string, unknown>) };
      });
      const target = variants.find((item) => {
        if (!item || typeof item !== "object") return false;
        const row = item as Record<string, unknown>;
        return (
          typeof row.color === "string" &&
          row.color.trim() &&
          typeof row.size === "string" &&
          row.size.trim()
        );
      }) as Record<string, unknown> | undefined;
      if (target) {
        target.qty = Math.max(0, Number(target.qty) || 0) + qty;
        metadata.variants = variants;
        nextQty = sumVariantQuantities(
          variants as { color?: string; size?: string; qty?: number }[],
        );
      }
    }

    const priorCost = Math.max(0, Number(existing.cost) || 0);
    const nextCost = mergeUnitCost(priorQty, priorCost, qty, totalCost);

    const { error } = await supabase
      .from("products")
      .update({
        inventory_quantity: nextQty,
        cost: nextCost,
        metadata: metadata as import("@/types/database").Json,
      })
      .eq("id", input.productId);

    if (error) throw error;

    await supabase.from("inventory_movements").insert({
      product_id: input.productId,
      quantity_change: qty,
      reason: "purchase",
      reference_type: "supplier",
      notes: `Supplier purchase · $${totalCost.toFixed(2)}`,
      created_by: auth.userId,
    });

    await recordProductPurchase({
      name: existing.name,
      qty,
      totalCost,
      sku: existing.sku,
      productId: input.productId,
    });

    revalidatePath("/admin/supplier");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${input.productId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/wallet");
    revalidatePath("/shop");

    return {
      success: true,
      message: `Bought ${qty} × ${existing.name} for $${totalCost.toFixed(2)} — ${nextQty} on hand.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to purchase product stock.",
    };
  }
}

export async function purchaseSupplyBoxFromSupplier(input: {
  name: string;
  length?: number;
  width?: number;
  height?: number;
  qty: number;
  cost: number;
  lowStockThreshold?: number;
}): Promise<SupplierActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const totalCost = money(Number(input.cost) || 0);
  const afford = await assertAffordable(totalCost);
  if (afford) return afford;

  const result = await addSupplyBox({
    name: input.name,
    length: input.length,
    width: input.width,
    height: input.height,
    qty: input.qty,
    cost: totalCost,
    lowStockThreshold: input.lowStockThreshold,
  });
  return { success: result.success, message: result.message };
}

export async function purchaseSupplyItemFromSupplier(input: {
  name: string;
  qty: number;
  unit?: string;
  notes?: string;
  cost: number;
  lowStockThreshold?: number;
}): Promise<SupplierActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const totalCost = money(Number(input.cost) || 0);
  const afford = await assertAffordable(totalCost);
  if (afford) return afford;

  const result = await addSupplyItem({
    name: input.name,
    qty: input.qty,
    unit: input.unit,
    notes: input.notes,
    cost: totalCost,
    lowStockThreshold: input.lowStockThreshold,
  });
  return { success: result.success, message: result.message };
}

export async function restockSupplyFromSupplier(input: {
  id: string;
  kind: "box" | "item";
  restockQty: number;
  restockCost: number;
}): Promise<SupplierActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const totalCost = money(Number(input.restockCost) || 0);
  const afford = await assertAffordable(totalCost);
  if (afford) return afford;

  const result = await updateSupplyEntry({
    id: input.id,
    kind: input.kind,
    restockQty: input.restockQty,
    restockCost: totalCost,
  });
  return { success: result.success, message: result.message };
}
