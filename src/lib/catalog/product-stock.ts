import type { Product } from "@/types";

export type ProductStockVariant = {
  color: string;
  size: string;
  qty: number;
};

export type ProductStockBySize = {
  size: string;
  qty: number;
};

type StockProduct = Pick<
  Product,
  "inventory_quantity" | "low_stock_threshold" | "metadata"
>;

type VariantLike = {
  color?: string | null;
  size?: string | null;
  qty?: number | null;
};

/** Normalize matrix rows: size required; blank color becomes Default. */
export function normalizeStockVariants(
  variants: VariantLike[] | null | undefined,
): ProductStockVariant[] {
  return (variants ?? [])
    .map((row) => {
      const size = typeof row.size === "string" ? row.size.trim() : "";
      if (!size) return null;
      const color =
        typeof row.color === "string" && row.color.trim()
          ? row.color.trim()
          : "Default";
      const qty = Number(row.qty);
      return {
        color,
        size,
        qty: Number.isFinite(qty) && qty >= 0 ? Math.floor(qty) : 0,
      } satisfies ProductStockVariant;
    })
    .filter((row): row is ProductStockVariant => row != null);
}

/** Parse color/size/qty rows from product metadata.variants. */
export function getProductStockVariants(
  product: Pick<Product, "metadata"> | null | undefined,
): ProductStockVariant[] {
  const raw = product?.metadata?.variants;
  if (!Array.isArray(raw)) return [];
  return normalizeStockVariants(
    raw.map((item) => {
      if (!item || typeof item !== "object") return {};
      const row = item as Record<string, unknown>;
      return {
        color: typeof row.color === "string" ? row.color : "",
        size: typeof row.size === "string" ? row.size : "",
        qty: Number(row.qty),
      };
    }),
  );
}

export function productHasMultipleSizes(
  product: Pick<Product, "metadata"> | null | undefined,
): boolean {
  return (
    product?.metadata?.hasMultipleSizes === true ||
    getProductStockVariants(product).length > 0
  );
}

/**
 * Units on hand: prefer sum of size/color variant qtys when present,
 * otherwise `inventory_quantity`.
 */
export function getProductStockQuantity(product: StockProduct): number {
  const variants = getProductStockVariants(product);
  if (variants.length > 0) {
    return variants.reduce((sum, row) => sum + row.qty, 0);
  }
  const qty = product.inventory_quantity;
  return Number.isFinite(qty) ? Math.max(0, Math.floor(Number(qty))) : 0;
}

/** Aggregate on-hand qty by size (multi-size products). */
export function getProductStockBySize(
  product: Pick<Product, "metadata"> | null | undefined,
): ProductStockBySize[] {
  const bySize = new Map<string, number>();
  for (const row of getProductStockVariants(product)) {
    bySize.set(row.size, (bySize.get(row.size) ?? 0) + row.qty);
  }
  return Array.from(bySize.entries())
    .map(([size, qty]) => ({ size, qty }))
    .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }));
}

export type ProductStockState = "ok" | "low" | "out";

export function getProductStockState(product: StockProduct): ProductStockState {
  const qty = getProductStockQuantity(product);
  if (qty <= 0) return "out";
  if (qty <= (product.low_stock_threshold ?? 0)) return "low";
  return "ok";
}

/** Compact label like `S:2 · M:4 · L:0` for admin tables. */
export function formatProductStockBySize(
  product: Pick<Product, "metadata"> | null | undefined,
): string | null {
  const rows = getProductStockBySize(product);
  if (rows.length === 0) return null;
  return rows.map((row) => `${row.size}:${row.qty}`).join(" · ");
}

/** Sum variant qtys for form payloads (size required; color optional). */
export function sumVariantQuantities(
  variants: VariantLike[] | null | undefined,
): number {
  return normalizeStockVariants(variants).reduce(
    (sum, row) => sum + row.qty,
    0,
  );
}
