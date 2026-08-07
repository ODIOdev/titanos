"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createSupplyBox,
  createSupplyItem,
  emptySuppliesInventory,
  mergeUnitCost,
  parseSuppliesInventory,
  SUPPLIES_INVENTORY_KEY,
  type SuppliesInventory,
} from "@/lib/admin/supplies-inventory";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type SuppliesActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; result: SuppliesActionResult<SuppliesInventory> }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      result: {
        success: false,
        message: "Supabase is not configured.",
      },
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

async function readInventory(): Promise<SuppliesInventory> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SUPPLIES_INVENTORY_KEY)
    .maybeSingle();
  return parseSuppliesInventory(data?.value);
}

async function writeInventory(
  inventory: SuppliesInventory,
): Promise<void> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: SUPPLIES_INVENTORY_KEY,
      value: inventory as unknown as import("@/types/database").Json,
    },
    { onConflict: "key" },
  );
  if (error) throw error;
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/supplier");
}

export async function getSuppliesInventory(): Promise<SuppliesInventory> {
  if (!isSupabaseConfigured()) return emptySuppliesInventory();
  try {
    return await readInventory();
  } catch {
    return emptySuppliesInventory();
  }
}

export async function addSupplyBox(input: {
  name: string;
  length?: number;
  width?: number;
  height?: number;
  qty: number;
  /** Total purchase cost for this qty (used to derive per-count price). */
  cost?: number;
  lowStockThreshold?: number;
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const name = input.name?.trim();
  if (!name) {
    return { success: false, message: "Enter a box name or size label." };
  }
  const qty = Math.floor(Number(input.qty));
  if (!Number.isFinite(qty) || qty < 0) {
    return { success: false, message: "Enter a valid quantity." };
  }
  const totalCost = Math.max(0, Number(input.cost) || 0);
  if (input.cost != null && !Number.isFinite(Number(input.cost))) {
    return { success: false, message: "Enter a valid cost." };
  }

  try {
    const inventory = await readInventory();
    const existing = inventory.boxes.find(
      (b) =>
        b.name.toLowerCase() === name.toLowerCase() &&
        b.length === Math.max(0, Number(input.length) || 0) &&
        b.width === Math.max(0, Number(input.width) || 0) &&
        b.height === Math.max(0, Number(input.height) || 0),
    );
    if (existing) {
      existing.unitCost = mergeUnitCost(
        existing.qty,
        existing.unitCost,
        qty,
        totalCost,
      );
      existing.qty += qty;
    } else {
      inventory.boxes.push(
        createSupplyBox({
          name,
          length: input.length,
          width: input.width,
          height: input.height,
          qty,
          totalCost,
          lowStockThreshold: input.lowStockThreshold,
        }),
      );
    }
    inventory.boxes.sort((a, b) => a.name.localeCompare(b.name));
    await writeInventory(inventory);
    if (totalCost > 0 && qty > 0) {
      const { recordSuppliesPurchase } = await import("@/lib/actions/wallet");
      await recordSuppliesPurchase({ name, qty, totalCost });
    }
    return {
      success: true,
      message: existing
        ? `Added ${qty} to “${name}” — now ${existing.qty} on hand.`
        : `Added box “${name}” with ${qty} on hand.`,
      data: inventory,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to save supply box.",
    };
  }
}

export async function addSupplyItem(input: {
  name: string;
  qty: number;
  unit?: string;
  notes?: string;
  /** Total purchase cost for this qty (used to derive per-count price). */
  cost?: number;
  lowStockThreshold?: number;
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const name = input.name?.trim();
  if (!name) {
    return { success: false, message: "Enter an item name." };
  }
  const qty = Math.floor(Number(input.qty));
  if (!Number.isFinite(qty) || qty < 0) {
    return { success: false, message: "Enter a valid quantity." };
  }
  const totalCost = Math.max(0, Number(input.cost) || 0);
  if (input.cost != null && !Number.isFinite(Number(input.cost))) {
    return { success: false, message: "Enter a valid cost." };
  }

  try {
    const inventory = await readInventory();
    const unit = (input.unit ?? "each").trim() || "each";
    const existing = inventory.items.find(
      (i) =>
        i.name.toLowerCase() === name.toLowerCase() &&
        i.unit.toLowerCase() === unit.toLowerCase(),
    );
    if (existing) {
      existing.unitCost = mergeUnitCost(
        existing.qty,
        existing.unitCost,
        qty,
        totalCost,
      );
      existing.qty += qty;
      if (input.notes?.trim()) existing.notes = input.notes.trim();
    } else {
      inventory.items.push(
        createSupplyItem({
          name,
          qty,
          unit,
          notes: input.notes,
          totalCost,
          lowStockThreshold: input.lowStockThreshold,
        }),
      );
    }
    inventory.items.sort((a, b) => a.name.localeCompare(b.name));
    await writeInventory(inventory);
    if (totalCost > 0 && qty > 0) {
      const { recordSuppliesPurchase } = await import("@/lib/actions/wallet");
      await recordSuppliesPurchase({ name, qty, totalCost });
    }
    return {
      success: true,
      message: existing
        ? `Added ${qty} to “${name}” — now ${existing.qty} on hand.`
        : `Added item “${name}” with ${qty} on hand.`,
      data: inventory,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to save supply item.",
    };
  }
}

export async function adjustSupplyQty(input: {
  id: string;
  kind: "box" | "item";
  delta: number;
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const delta = Math.trunc(Number(input.delta) || 0);
  if (!delta) {
    return { success: false, message: "Enter a quantity change." };
  }

  try {
    const inventory = await readInventory();
    const list =
      input.kind === "box" ? inventory.boxes : inventory.items;
    const entry = list.find((e) => e.id === input.id);
    if (!entry) {
      return { success: false, message: "Supply entry not found." };
    }
    entry.qty = Math.max(0, entry.qty + delta);
    await writeInventory(inventory);
    return {
      success: true,
      message: `“${entry.name}” now ${entry.qty} on hand.`,
      data: inventory,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to update quantity.",
    };
  }
}

export async function updateSupplyEntry(input: {
  id: string;
  kind: "box" | "item";
  name?: string;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
  notes?: string;
  qty?: number;
  lowStockThreshold?: number;
  /** Add stock with purchase cost → weighted unit cost. */
  restockQty?: number;
  restockCost?: number;
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const inventory = await readInventory();
    if (input.kind === "box") {
      const box = inventory.boxes.find((b) => b.id === input.id);
      if (!box) {
        return { success: false, message: "Box not found." };
      }
      if (input.name != null) {
        const name = input.name.trim();
        if (!name) return { success: false, message: "Enter a box name." };
        box.name = name;
      }
      if (input.length != null) box.length = Math.max(0, Number(input.length) || 0);
      if (input.width != null) box.width = Math.max(0, Number(input.width) || 0);
      if (input.height != null) box.height = Math.max(0, Number(input.height) || 0);
      if (input.lowStockThreshold != null) {
        box.lowStockThreshold = Math.max(
          0,
          Math.floor(Number(input.lowStockThreshold) || 0),
        );
      }
      if (input.qty != null) {
        const qty = Math.floor(Number(input.qty));
        if (!Number.isFinite(qty) || qty < 0) {
          return { success: false, message: "Enter a valid quantity." };
        }
        box.qty = qty;
      }
      const restockQty = Math.floor(Number(input.restockQty) || 0);
      const restockCost = Math.max(0, Number(input.restockCost) || 0);
      if (restockQty > 0) {
        box.unitCost = mergeUnitCost(
          box.qty,
          box.unitCost,
          restockQty,
          restockCost,
        );
        box.qty += restockQty;
      }
      inventory.boxes.sort((a, b) => a.name.localeCompare(b.name));
      await writeInventory(inventory);
      if (restockQty > 0 && restockCost > 0) {
        const { recordSuppliesPurchase } = await import("@/lib/actions/wallet");
        await recordSuppliesPurchase({
          name: box.name,
          qty: restockQty,
          totalCost: restockCost,
        });
      }
      return {
        success: true,
        message: "Supply updated.",
        data: inventory,
      };
    } else {
      const item = inventory.items.find((i) => i.id === input.id);
      if (!item) {
        return { success: false, message: "Item not found." };
      }
      if (input.name != null) {
        const name = input.name.trim();
        if (!name) return { success: false, message: "Enter an item name." };
        item.name = name;
      }
      if (input.unit != null) {
        item.unit = input.unit.trim() || "each";
      }
      if (input.notes != null) {
        item.notes = input.notes.trim() || undefined;
      }
      if (input.lowStockThreshold != null) {
        item.lowStockThreshold = Math.max(
          0,
          Math.floor(Number(input.lowStockThreshold) || 0),
        );
      }
      if (input.qty != null) {
        const qty = Math.floor(Number(input.qty));
        if (!Number.isFinite(qty) || qty < 0) {
          return { success: false, message: "Enter a valid quantity." };
        }
        item.qty = qty;
      }
      const restockQty = Math.floor(Number(input.restockQty) || 0);
      const restockCost = Math.max(0, Number(input.restockCost) || 0);
      if (restockQty > 0) {
        item.unitCost = mergeUnitCost(
          item.qty,
          item.unitCost,
          restockQty,
          restockCost,
        );
        item.qty += restockQty;
      }
      inventory.items.sort((a, b) => a.name.localeCompare(b.name));
      await writeInventory(inventory);
      if (restockQty > 0 && restockCost > 0) {
        const { recordSuppliesPurchase } = await import("@/lib/actions/wallet");
        await recordSuppliesPurchase({
          name: item.name,
          qty: restockQty,
          totalCost: restockCost,
        });
      }
      return {
        success: true,
        message: "Supply updated.",
        data: inventory,
      };
    }
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to update supply.",
    };
  }
}

export async function removeSupplyEntry(input: {
  id: string;
  kind: "box" | "item";
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const inventory = await readInventory();
    if (input.kind === "box") {
      inventory.boxes = inventory.boxes.filter((b) => b.id !== input.id);
    } else {
      inventory.items = inventory.items.filter((i) => i.id !== input.id);
    }
    await writeInventory(inventory);
    return {
      success: true,
      message: "Supply removed.",
      data: inventory,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to remove supply.",
    };
  }
}

/**
 * Pack / build a product using warehouse supplies:
 * deduct selected boxes (and optional items), remember box dims on the product.
 */
export async function buildProductWithSupplies(input: {
  productId: string;
  boxId: string;
  boxQty: number;
  itemUsages?: { id: string; qty: number }[];
}): Promise<SuppliesActionResult<SuppliesInventory>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const productId = input.productId?.trim();
  if (!productId) {
    return { success: false, message: "Product is required." };
  }

  const boxQty = Math.floor(Number(input.boxQty));
  if (!Number.isFinite(boxQty) || boxQty < 1) {
    return { success: false, message: "Use at least 1 box." };
  }

  try {
    const inventory = await readInventory();
    const box = inventory.boxes.find((b) => b.id === input.boxId);
    if (!box) {
      return { success: false, message: "Select a box from supplies." };
    }
    if (box.qty < boxQty) {
      return {
        success: false,
        message: `Only ${box.qty} “${box.name}” on hand.`,
      };
    }

    const usages = (input.itemUsages ?? [])
      .map((u) => ({
        id: u.id,
        qty: Math.floor(Number(u.qty) || 0),
      }))
      .filter((u) => u.qty > 0);

    for (const usage of usages) {
      const item = inventory.items.find((i) => i.id === usage.id);
      if (!item) {
        return { success: false, message: "Supply item not found." };
      }
      if (item.qty < usage.qty) {
        return {
          success: false,
          message: `Only ${item.qty} ${item.unit} of “${item.name}” on hand.`,
        };
      }
    }

    box.qty -= boxQty;
    for (const usage of usages) {
      const item = inventory.items.find((i) => i.id === usage.id)!;
      item.qty -= usage.qty;
    }

    await writeInventory(inventory);

    // Remember packaging dims on the product for future labels.
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: product, error } = await supabase
      .from("products")
      .select("id, metadata")
      .eq("id", productId)
      .maybeSingle();
    if (error) throw error;
    if (product) {
      const base =
        product.metadata &&
        typeof product.metadata === "object" &&
        !Array.isArray(product.metadata)
          ? { ...(product.metadata as Record<string, unknown>) }
          : {};
      const shippingPackage = {
        pounds: 0,
        ounces: 0,
        length: box.length,
        width: box.width,
        height: box.height,
        presetId: null,
        updatedAt: new Date().toISOString(),
        supplyBoxId: box.id,
        supplyBoxName: box.name,
      };
      const { error: updateError } = await supabase
        .from("products")
        .update({
          metadata: {
            ...base,
            shippingPackage,
          } as import("@/types/database").Json,
        })
        .eq("id", productId);
      if (updateError) throw updateError;
      revalidatePath(`/admin/products/${productId}`);
      revalidatePath("/admin/products");
    }

    const itemNote =
      usages.length > 0
        ? ` · ${usages.length} supply item${usages.length === 1 ? "" : "s"} used`
        : "";
    return {
      success: true,
      message: `Built with ${boxQty}× ${box.name}${itemNote}.`,
      data: inventory,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to build with supplies.",
    };
  }
}
