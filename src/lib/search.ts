import type { Product } from "@/types";
import { parseProductTags } from "@/lib/data/catalog-options";

/** Escape user input for PostgREST `or` / `ilike` filter values. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
}

export function matchesQuery(haystack: string | null | undefined, q: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q);
}

/** Broad product text match used by admin + storefront search. */
export function productMatchesQuery(
  product: Pick<
    Product,
    | "name"
    | "sku"
    | "description"
    | "short_description"
    | "product_type"
    | "color"
    | "size"
    | "ansi_class"
    | "metadata"
  > & {
    brand?: { name?: string | null } | null;
    category?: { name?: string | null } | null;
  },
  rawQuery: string,
): boolean {
  return productSearchScore(product, rawQuery) > 0 || !rawQuery.trim();
}

/**
 * Higher = better match. Used to rank live search results.
 * Exact SKU/name beats partial, which beats secondary fields.
 */
export function productSearchScore(
  product: Pick<
    Product,
    | "name"
    | "sku"
    | "description"
    | "short_description"
    | "product_type"
    | "color"
    | "size"
    | "ansi_class"
    | "metadata"
  > & {
    brand?: { name?: string | null } | null;
    category?: { name?: string | null } | null;
  },
  rawQuery: string,
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const name = product.name?.toLowerCase() ?? "";
  const sku = product.sku?.toLowerCase() ?? "";
  const tags = parseProductTags(product.metadata).map((tag) =>
    tag.toLowerCase(),
  );
  const brand = product.brand?.name?.toLowerCase() ?? "";
  const category = product.category?.name?.toLowerCase() ?? "";

  let score = 0;
  if (sku === q) score = Math.max(score, 100);
  else if (sku.startsWith(q)) score = Math.max(score, 90);
  else if (sku.includes(q)) score = Math.max(score, 80);

  if (name === q) score = Math.max(score, 95);
  else if (name.startsWith(q)) score = Math.max(score, 85);
  else if (name.includes(q)) score = Math.max(score, 70);

  if (tags.some((tag) => tag === q)) score = Math.max(score, 65);
  else if (tags.some((tag) => tag.includes(q))) score = Math.max(score, 55);

  if (brand.includes(q)) score = Math.max(score, 50);
  if (category.includes(q)) score = Math.max(score, 45);

  if (matchesQuery(product.product_type, q)) score = Math.max(score, 35);
  if (matchesQuery(product.color, q)) score = Math.max(score, 30);
  if (matchesQuery(product.size, q)) score = Math.max(score, 30);
  if (matchesQuery(product.ansi_class, q)) score = Math.max(score, 30);
  if (matchesQuery(product.short_description, q)) score = Math.max(score, 20);
  if (matchesQuery(product.description, q)) score = Math.max(score, 15);

  return score;
}
