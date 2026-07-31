/**
 * Detail screens are reachable from more than one admin list, so the list that
 * launched them tags its links with `?from=…` and the detail screen sends the
 * admin back there instead of to its default parent.
 */
export const ADMIN_RETURN_PARAM = "from";

export type AdminReturnKey = "inventory";

type AdminReturnTarget = { href: string; label: string };

const RETURN_TARGETS: Record<AdminReturnKey, AdminReturnTarget> = {
  inventory: { href: "/admin/inventory", label: "Back to inventory" },
};

export function adminReturnTarget(
  from: string | null | undefined,
): AdminReturnTarget | null {
  if (!from) return null;
  return RETURN_TARGETS[from as AdminReturnKey] ?? null;
}

export function withAdminReturn(href: string, from: AdminReturnKey): string {
  return `${href}${href.includes("?") ? "&" : "?"}${ADMIN_RETURN_PARAM}=${from}`;
}
