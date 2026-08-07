import {
  getProductStockQuantity,
  getProductStockVariants,
  normalizeStockVariants,
  sumVariantQuantities,
  type ProductStockVariant,
} from "@/lib/catalog/product-stock";
import type { Json } from "@/types/database";

/** Supabase service client shape used for inventory mutations. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = any;

export type OrderStockLine = {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  variantKey?: string | null;
};

export type InventoryResult = {
  success: boolean;
  message: string;
  changedProductIds: string[];
};

const SALE_REASON = "sale";
const RESTORE_REASONS = ["return", "cancellation", "refund"] as const;

/** Cart / matrix keys look like `Red::M` or `Default::L`. */
export function parseVariantKey(variantKey?: string | null): {
  color?: string;
  size?: string;
} {
  if (!variantKey || typeof variantKey !== "string") return {};
  const trimmed = variantKey.trim();
  if (!trimmed) return {};
  const sep = trimmed.indexOf("::");
  if (sep < 0) {
    return { size: trimmed };
  }
  const color = trimmed.slice(0, sep).trim();
  const size = trimmed.slice(sep + 2).trim();
  return {
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
  };
}

export function optionsFromVariantKey(variantKey?: string | null): {
  color?: string;
  size?: string;
  variant_key?: string;
} {
  if (!variantKey?.trim()) return {};
  const parsed = parseVariantKey(variantKey);
  return {
    ...parsed,
    variant_key: variantKey.trim(),
  };
}

export function stockOptionsFromOrderItem(options: unknown): {
  color?: string;
  size?: string;
  variantKey?: string;
} {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return {};
  }
  const row = options as Record<string, unknown>;
  const variantKey =
    typeof row.variant_key === "string"
      ? row.variant_key
      : typeof row.variantId === "string"
        ? row.variantId
        : null;
  const fromKey = parseVariantKey(variantKey);
  const color =
    typeof row.color === "string" && row.color.trim()
      ? row.color.trim()
      : fromKey.color;
  const size =
    typeof row.size === "string" && row.size.trim()
      ? row.size.trim()
      : fromKey.size;
  return {
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
    ...(variantKey ? { variantKey } : {}),
  };
}

function asMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return { ...(metadata as Record<string, unknown>) };
  }
  return {};
}

/**
 * Apply a signed qty change to a product row.
 * Negative delta = sale; positive = return/replenish into matching size/color.
 */
export function applyStockDelta(
  product: {
    inventory_quantity: number | null;
    metadata?: unknown;
  },
  delta: number,
  opts?: { color?: string | null; size?: string | null },
): {
  inventory_quantity: number;
  metadata: Record<string, unknown>;
  applied: number;
} {
  const change = Math.trunc(Number(delta) || 0);
  const metadata = asMetadataRecord(product.metadata);
  const variants = getProductStockVariants({ metadata: metadata as never });

  if (variants.length === 0) {
    const current = Math.max(0, Math.floor(Number(product.inventory_quantity) || 0));
    const next = Math.max(0, current + change);
    return {
      inventory_quantity: next,
      metadata,
      applied: next - current,
    };
  }

  const nextVariants: ProductStockVariant[] = variants.map((row) => ({
    ...row,
  }));
  let remaining = Math.abs(change);
  const deducting = change < 0;

  const color = opts?.color?.trim() || undefined;
  const size = opts?.size?.trim() || undefined;

  const matches = (row: ProductStockVariant) => {
    if (size && row.size !== size) return false;
    if (color && row.color !== color) return false;
    return Boolean(size || color);
  };

  if (deducting) {
    const targets =
      size || color
        ? nextVariants.filter(matches)
        : nextVariants;
    for (const row of targets) {
      if (remaining <= 0) break;
      const take = Math.min(row.qty, remaining);
      row.qty -= take;
      remaining -= take;
    }
    // Fall back across other cells if a specific variant was short.
    if (remaining > 0 && (size || color)) {
      for (const row of nextVariants) {
        if (remaining <= 0) break;
        if (targets.includes(row)) continue;
        const take = Math.min(row.qty, remaining);
        row.qty -= take;
        remaining -= take;
      }
    }
  } else {
    let target =
      size || color
        ? nextVariants.find(matches)
        : nextVariants[0];
    if (!target && (size || color)) {
      target = {
        color: color || "Default",
        size: size || "OS",
        qty: 0,
      };
      nextVariants.push(target);
    }
    if (target) {
      target.qty += remaining;
      remaining = 0;
    }
  }

  metadata.variants = nextVariants;
  metadata.hasMultipleSizes = true;
  const inventory_quantity = sumVariantQuantities(nextVariants);
  const applied = deducting
    ? -(Math.abs(change) - remaining)
    : Math.abs(change) - remaining;

  return { inventory_quantity, metadata, applied };
}

export function availableStockForLine(
  product: {
    inventory_quantity: number | null;
    metadata?: unknown;
    low_stock_threshold?: number | null;
  },
  opts?: { color?: string | null; size?: string | null; variantKey?: string | null },
): number {
  const parsed = {
    ...parseVariantKey(opts?.variantKey),
    ...(opts?.color ? { color: opts.color } : {}),
    ...(opts?.size ? { size: opts.size } : {}),
  };
  const variants = getProductStockVariants({
    metadata: asMetadataRecord(product.metadata) as never,
  });
  if (variants.length === 0) {
    return getProductStockQuantity({
      inventory_quantity: Number(product.inventory_quantity) || 0,
      low_stock_threshold: product.low_stock_threshold ?? 0,
      metadata: asMetadataRecord(product.metadata) as never,
    });
  }
  if (parsed.size || parsed.color) {
    return variants
      .filter((row) => {
        if (parsed.size && row.size !== parsed.size) return false;
        if (parsed.color && row.color !== parsed.color) return false;
        return true;
      })
      .reduce((sum, row) => sum + row.qty, 0);
  }
  return variants.reduce((sum, row) => sum + row.qty, 0);
}

async function orderAlreadyHasMovements(
  supabase: ServiceClient,
  orderId: string,
  reasons: string[],
): Promise<boolean> {
  const { data } = await supabase
    .from("inventory_movements")
    .select("id")
    .eq("reference_type", "order")
    .eq("reference_id", orderId)
    .in("reason", reasons)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function mutateStockForLines(
  supabase: ServiceClient,
  orderId: string,
  lines: OrderStockLine[],
  direction: "deduct" | "restore",
  reason: string,
  notes?: string,
): Promise<InventoryResult> {
  const changedProductIds: string[] = [];
  const sign = direction === "deduct" ? -1 : 1;

  for (const line of lines) {
    if (!line.productId || line.quantity <= 0) continue;

    const { data: product, error } = await supabase
      .from("products")
      .select("id, inventory_quantity, metadata")
      .eq("id", line.productId)
      .maybeSingle();

    if (error) throw error;
    if (!product) continue;

    const parsed = {
      ...parseVariantKey(line.variantKey),
      ...(line.color ? { color: line.color } : {}),
      ...(line.size ? { size: line.size } : {}),
    };

    const next = applyStockDelta(
      product,
      sign * Math.floor(Number(line.quantity) || 0),
      parsed,
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({
        inventory_quantity: next.inventory_quantity,
        metadata: next.metadata as Json,
      })
      .eq("id", line.productId);

    if (updateError) throw updateError;

    const { error: moveError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: line.productId,
        quantity_change: sign * Math.floor(Number(line.quantity) || 0),
        reason,
        reference_type: "order",
        reference_id: orderId,
        notes: notes ?? null,
      });

    if (moveError) throw moveError;
    changedProductIds.push(line.productId);
  }

  return {
    success: true,
    message:
      direction === "deduct"
        ? "Inventory deducted for order."
        : "Inventory restored for order.",
    changedProductIds,
  };
}

async function loadOrderStockLines(
  supabase: ServiceClient,
  orderId: string,
): Promise<OrderStockLine[]> {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("product_id, quantity, options")
    .eq("order_id", orderId);

  if (error) throw error;

  return (items ?? [])
    .filter((item: { product_id: string | null }) => Boolean(item.product_id))
    .map(
      (item: {
        product_id: string;
        quantity: number;
        options: unknown;
      }) => {
        const opts = stockOptionsFromOrderItem(item.options);
        return {
          productId: item.product_id,
          quantity: Number(item.quantity) || 0,
          color: opts.color,
          size: opts.size,
          variantKey: opts.variantKey,
        } satisfies OrderStockLine;
      },
    );
}

/** Deduct on-hand stock for a paid/confirmed order (idempotent). */
export async function deductStockForOrder(
  supabase: ServiceClient,
  orderId: string,
  notes = "Order sale",
): Promise<InventoryResult> {
  if (await orderAlreadyHasMovements(supabase, orderId, [SALE_REASON])) {
    return {
      success: true,
      message: "Inventory already deducted for this order.",
      changedProductIds: [],
    };
  }

  const lines = await loadOrderStockLines(supabase, orderId);
  if (lines.length === 0) {
    return {
      success: true,
      message: "No product lines to deduct.",
      changedProductIds: [],
    };
  }

  return mutateStockForLines(
    supabase,
    orderId,
    lines,
    "deduct",
    SALE_REASON,
    notes,
  );
}

/** Restore stock after cancel/refund (idempotent; only if a sale was recorded). */
export async function restoreStockForOrder(
  supabase: ServiceClient,
  orderId: string,
  reason: (typeof RESTORE_REASONS)[number] = "cancellation",
  notes = "Order cancelled/refunded",
): Promise<InventoryResult> {
  if (!(await orderAlreadyHasMovements(supabase, orderId, [SALE_REASON]))) {
    return {
      success: true,
      message: "No prior sale deduction to restore.",
      changedProductIds: [],
    };
  }

  if (
    await orderAlreadyHasMovements(supabase, orderId, [...RESTORE_REASONS])
  ) {
    return {
      success: true,
      message: "Inventory already restored for this order.",
      changedProductIds: [],
    };
  }

  const lines = await loadOrderStockLines(supabase, orderId);
  if (lines.length === 0) {
    return {
      success: true,
      message: "No product lines to restore.",
      changedProductIds: [],
    };
  }

  return mutateStockForLines(
    supabase,
    orderId,
    lines,
    "restore",
    reason,
    notes,
  );
}

/** Statuses that should hold deducted inventory. */
export function orderStatusHoldsInventory(status: string | null | undefined) {
  return (
    status === "paid" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered"
  );
}

export function orderStatusReleasesInventory(status: string | null | undefined) {
  return status === "cancelled" || status === "refunded";
}

/** Re-export for callers updating admin forms. */
export { normalizeStockVariants };
