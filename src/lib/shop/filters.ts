import type { ProductFilters } from "@/types";

export type ShopSearchParams = {
  [key: string]: string | string[] | undefined;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Map URL sort values from ProductSort to getProducts sort keys. */
export function mapSortParam(sort: string | undefined): string | undefined {
  if (!sort || sort === "featured") return undefined;
  switch (sort) {
    case "price-asc":
      return "price_asc";
    case "price-desc":
      return "price_desc";
    case "bestselling":
      return "best_selling";
    case "newest":
    case "rating":
      return sort;
    default:
      return sort;
  }
}

export function parseShopFilters(
  searchParams: ShopSearchParams,
  overrides: Partial<ProductFilters> = {},
): ProductFilters {
  const minPrice = first(searchParams.minPrice);
  const maxPrice = first(searchParams.maxPrice);
  const rating = first(searchParams.rating);
  const page = first(searchParams.page);
  const availability = first(searchParams.availability);

  return {
    category: first(searchParams.category),
    brand: first(searchParams.brand),
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    productType: first(searchParams.productType),
    ansiClass: first(searchParams.ansiClass),
    color: first(searchParams.color),
    size: first(searchParams.size),
    availability: availability === "in_stock" ? "in_stock" : undefined,
    rating: rating ? Number(rating) : undefined,
    q: first(searchParams.q)?.trim() || undefined,
    sort: mapSortParam(first(searchParams.sort)),
    page: page ? Math.max(1, Number(page) || 1) : 1,
    ...overrides,
  };
}

export function toFilterQuery(
  searchParams: ShopSearchParams,
): Record<string, string | undefined> {
  const keys = [
    "category",
    "brand",
    "minPrice",
    "maxPrice",
    "productType",
    "ansiClass",
    "color",
    "size",
    "availability",
    "rating",
    "q",
    "sort",
  ] as const;

  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = first(searchParams[key]);
    if (value) result[key] = value;
  }
  return result;
}
