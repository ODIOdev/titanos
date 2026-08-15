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

const SEARCH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "from",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "much",
  "my",
  "of",
  "on",
  "or",
  "please",
  "show",
  "tell",
  "that",
  "the",
  "their",
  "them",
  "these",
  "this",
  "to",
  "us",
  "what",
  "which",
  "with",
  "you",
  "your",
]);

/** Meaningful tokens for catalog search (drops stopwords / tiny fragments). */
export function searchQueryTokens(rawQuery: string): string[] {
  return rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9+\-./\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !SEARCH_STOPWORDS.has(token));
}

type SearchableProduct = Pick<
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
};

function productSearchBlob(product: SearchableProduct): string {
  const tags = parseProductTags(product.metadata).join(" ");
  return [
    product.name,
    product.sku,
    product.brand?.name,
    product.category?.name,
    product.product_type,
    product.color,
    product.size,
    product.ansi_class,
    product.short_description,
    product.description,
    tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function phraseScore(product: SearchableProduct, q: string): number {
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

/** Broad product text match used by admin + storefront search. */
export function productMatchesQuery(
  product: SearchableProduct,
  rawQuery: string,
): boolean {
  return productSearchScore(product, rawQuery) > 0 || !rawQuery.trim();
}

/**
 * Higher = better match. Used to rank live search results.
 * Exact SKU/name beats partial phrase matches; multi-word queries also
 * match when all significant tokens appear across product fields.
 */
export function productSearchScore(
  product: SearchableProduct,
  rawQuery: string,
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const phrase = phraseScore(product, q);
  const tokens = searchQueryTokens(rawQuery);

  if (tokens.length <= 1) {
    return Math.max(phrase, tokens[0] ? phraseScore(product, tokens[0]) : 0);
  }

  const blob = productSearchBlob(product);
  const matched = tokens.filter((token) => blob.includes(token));
  if (matched.length === 0) return phrase;

  // Prefer products that cover every meaningful token (e.g. "portwest gloves").
  const coverage = matched.length / tokens.length;
  if (coverage < 1 && matched.length < 2 && phrase === 0) {
    // Single weak token in a long question is too noisy.
    return 0;
  }

  const tokenScore = Math.round(40 + coverage * 45 + matched.length * 3);
  return Math.max(phrase, tokenScore);
}
