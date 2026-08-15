import { getProductStockQuantity } from "@/lib/catalog/product-stock";
import { searchProducts } from "@/lib/data/products";

export type SupportCatalogHit = {
  name: string;
  slug: string;
  sku: string;
  href: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  stockQuantity: number;
  ratingAvg: number;
  ratingCount: number;
  brand: string | null;
  category: string | null;
  ansiClass: string | null;
  shortDescription: string | null;
};

export type SupportChatLink = { label: string; href: string };

function toHit(
  product: Awaited<ReturnType<typeof searchProducts>>[number],
): SupportCatalogHit {
  const stockQuantity = getProductStockQuantity(product);
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    href: `/product/${product.slug}`,
    price: Number(product.price ?? 0),
    compareAtPrice:
      product.compare_at_price != null
        ? Number(product.compare_at_price)
        : null,
    inStock: stockQuantity > 0,
    stockQuantity,
    ratingAvg: Number(product.rating_avg ?? 0),
    ratingCount: Number(product.rating_count ?? 0),
    brand: product.brand?.name ?? null,
    category: product.category?.name ?? null,
    ansiClass: product.ansi_class,
    shortDescription: product.short_description,
  };
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function truncateAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > Math.floor(max * 0.45) ? cut.slice(0, space) : cut).trimEnd();
  return `${base}…`;
}

function shortProductLabel(hit: SupportCatalogHit) {
  const name = hit.name
    .replace(/[®™]/g, "")
    .replace(/^(PORTWEST|Pyramex|Cordova Safety|Titan Safety)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return truncateAtWord(name || hit.sku || "Product", 36);
}

function stockLine(hit: SupportCatalogHit) {
  if (!hit.inStock || hit.stockQuantity <= 0) return "Out of stock";
  if (hit.stockQuantity <= 12) return `Low stock (${hit.stockQuantity})`;
  return `${hit.stockQuantity} in stock`;
}

/**
 * Compact, chat-safe product reply. Links go in chips (not raw URLs).
 */
export function formatCatalogChatReply(hits: SupportCatalogHit[]): {
  text: string;
  links: SupportChatLink[];
} {
  const top = hits.slice(0, 3);
  const lines = top.map((hit, index) => {
    const rating =
      hit.ratingCount > 0 ? ` · ${hit.ratingAvg.toFixed(1)}★` : "";
    return `${index + 1}. ${shortProductLabel(hit)} — ${formatMoney(hit.price)} · ${stockLine(hit)}${rating}`;
  });

  const text =
    top.length === 1
      ? `Found it:\n${lines[0]}`
      : `Here are ${top.length} matches:\n${lines.join("\n")}`;

  const links = top.map((hit) => ({
    label: truncateAtWord(shortProductLabel(hit), 22),
    href: hit.href,
  }));

  return { text, links };
}

/**
 * Live catalog lookup for support chat tool calls.
 */
export async function searchCatalogForChat(
  query: string,
  limit = 5,
): Promise<SupportCatalogHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const cap = Math.min(Math.max(limit, 1), 8);
  const products = await searchProducts(q, cap);
  return products.map(toHit);
}
