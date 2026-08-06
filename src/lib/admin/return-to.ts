/**
 * Detail screens are reachable from more than one admin list, so the list that
 * launched them tags its links with `?from=…` and the detail screen sends the
 * admin back there instead of to its default parent.
 */
export const ADMIN_RETURN_PARAM = "from";

export type AdminReturnKey =
  | "inventory"
  | `category:${string}`
  | `brand:${string}`;

type AdminReturnTarget = { href: string; label: string };

const RETURN_TARGETS: Record<"inventory", AdminReturnTarget> = {
  inventory: { href: "/admin/inventory", label: "Back to inventory" },
};

const CATEGORY_FROM = /^category:(.+)$/;
const BRAND_FROM = /^brand:(.+)$/;

export function categoryReturnKey(categoryId: string): AdminReturnKey {
  return `category:${categoryId}`;
}

export function brandReturnKey(brandId: string): AdminReturnKey {
  return `brand:${brandId}`;
}

export function categoryIdFromReturn(
  from: string | null | undefined,
): string | null {
  if (!from) return null;
  const match = CATEGORY_FROM.exec(from);
  return match?.[1] ?? null;
}

export function brandIdFromReturn(
  from: string | null | undefined,
): string | null {
  if (!from) return null;
  const match = BRAND_FROM.exec(from);
  return match?.[1] ?? null;
}

export function adminReturnTarget(
  from: string | null | undefined,
): AdminReturnTarget | null {
  if (!from) return null;
  if (from === "inventory") return RETURN_TARGETS.inventory;

  const categoryId = categoryIdFromReturn(from);
  if (categoryId) {
    return {
      href: `/admin/categories/${categoryId}`,
      label: "Back to category",
    };
  }

  const brandId = brandIdFromReturn(from);
  if (brandId) {
    return {
      href: `/admin/brands/${brandId}`,
      label: "Back to brand",
    };
  }

  return null;
}

export function withAdminReturn(href: string, from: AdminReturnKey | string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${ADMIN_RETURN_PARAM}=${encodeURIComponent(from)}`;
}
