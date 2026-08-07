"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEFAULT_BOX_PRESETS,
  parseBoxPresets,
  readProductShippingPackage,
  resolveOrderPackage,
  SHIPPING_BOX_PRESETS_KEY,
  type ProductShippingPackage,
  type ShippingBoxPreset,
  type ShippingPackageDims,
  normalizePackage,
} from "@/lib/shipping/packaging";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type PackagingActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; result: PackagingActionResult }
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
      return { ok: false, result: { success: false, message: "Sign in required." } };
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
        result: { success: false, message: "Master admin access required." },
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

function newPresetId() {
  return `box-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listShippingBoxPresets(): Promise<
  PackagingActionResult<ShippingBoxPreset[]>
> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.result.message };

  if (!isSupabaseConfigured()) {
    return { success: true, message: "Defaults", data: [...DEFAULT_BOX_PRESETS] };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SHIPPING_BOX_PRESETS_KEY)
      .maybeSingle();

    return {
      success: true,
      message: "Presets loaded.",
      data: parseBoxPresets(data?.value),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load box presets.",
      data: [...DEFAULT_BOX_PRESETS],
    };
  }
}

export async function saveShippingBoxPreset(input: {
  name: string;
  pounds: number;
  ounces: number;
  length: number;
  width: number;
  height: number;
}): Promise<PackagingActionResult<ShippingBoxPreset[]>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.result.message };

  const name = input.name.trim();
  if (!name) {
    return { success: false, message: "Name the box preset." };
  }
  const dims = normalizePackage(input);
  if (dims.length <= 0 || dims.width <= 0 || dims.height <= 0) {
    return {
      success: false,
      message: "Enter L × W × H (inches) before saving a box.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SHIPPING_BOX_PRESETS_KEY)
      .maybeSingle();

    const presets = parseBoxPresets(existing?.value);
    const next: ShippingBoxPreset = {
      id: newPresetId(),
      name,
      ...dims,
    };
    const merged = [...presets, next];

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: SHIPPING_BOX_PRESETS_KEY,
        value: { presets: merged },
      },
      { onConflict: "key" },
    );
    if (error) throw error;

    revalidatePath("/admin/orders");
    return {
      success: true,
      message: `Saved box “${name}”.`,
      data: merged,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save box preset.",
    };
  }
}

export async function deleteShippingBoxPreset(
  presetId: string,
): Promise<PackagingActionResult<ShippingBoxPreset[]>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.result.message };
  if (!presetId) {
    return { success: false, message: "Missing preset." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SHIPPING_BOX_PRESETS_KEY)
      .maybeSingle();

    const presets = parseBoxPresets(existing?.value).filter(
      (p) => p.id !== presetId,
    );
    const next = presets.length > 0 ? presets : [...DEFAULT_BOX_PRESETS];

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: SHIPPING_BOX_PRESETS_KEY,
        value: { presets: next },
      },
      { onConflict: "key" },
    );
    if (error) throw error;

    return {
      success: true,
      message: "Box preset removed.",
      data: next,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete preset.",
    };
  }
}

export async function getOrderRememberedPackage(input: {
  lines: Array<{ productId: string | null; quantity: number }>;
  fallbackItemCount: number;
}): Promise<
  PackagingActionResult<{
    package: ShippingPackageDims | null;
    source: "products" | "none";
    productCount: number;
  }>
> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.result.message };

  const productIds = [
    ...new Set(
      input.lines
        .map((l) => l.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (productIds.length === 0 || !isSupabaseConfigured()) {
    return {
      success: true,
      message: "No product packaging memory.",
      data: { package: null, source: "none", productCount: 0 },
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, metadata")
      .in("id", productIds);
    if (error) throw error;

    const byId = new Map(
      (products ?? []).map((p) => [
        p.id,
        readProductShippingPackage(p.metadata),
      ]),
    );

    const resolved = resolveOrderPackage({
      lines: input.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        pkg: line.productId ? byId.get(line.productId) ?? null : null,
      })),
      fallbackItemCount: input.fallbackItemCount,
    });

    const rememberedCount = [...byId.values()].filter(Boolean).length;

    return {
      success: true,
      message: resolved
        ? `Restored packaging from ${rememberedCount} product${rememberedCount === 1 ? "" : "s"}.`
        : "No remembered packaging yet.",
      data: {
        package: resolved,
        source: resolved ? "products" : "none",
        productCount: rememberedCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to load product packaging.",
    };
  }
}

/** Persist last-used package onto each product in the order (for repeat labels). */
export async function rememberProductsShippingPackage(input: {
  productIds: string[];
  package: ShippingPackageDims;
  presetId?: string | null;
}): Promise<PackagingActionResult<{ updated: number }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, message: auth.result.message };

  const ids = [...new Set(input.productIds.filter(Boolean))];
  if (ids.length === 0) {
    return { success: true, message: "No products to update.", data: { updated: 0 } };
  }

  const dims = normalizePackage(input.package);
  const shippingPackage: ProductShippingPackage = {
    ...dims,
    presetId: input.presetId ?? null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, metadata")
      .in("id", ids);
    if (error) throw error;

    let updated = 0;
    for (const product of products ?? []) {
      const base =
        product.metadata &&
        typeof product.metadata === "object" &&
        !Array.isArray(product.metadata)
          ? { ...(product.metadata as Record<string, unknown>) }
          : {};
      const metadata = {
        ...base,
        shippingPackage,
      } as import("@/types/database").Json;
      const { error: updateError } = await supabase
        .from("products")
        .update({ metadata })
        .eq("id", product.id);
      if (!updateError) updated += 1;
    }

    return {
      success: true,
      message: `Remembered packaging on ${updated} product${updated === 1 ? "" : "s"}.`,
      data: { updated },
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to remember product packaging.",
    };
  }
}
