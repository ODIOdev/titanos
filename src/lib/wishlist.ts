/** Wishlist lives per-device in localStorage — no account required. */

export const WISHLIST_STORAGE_KEY = "titan-wishlist";
export const WISHLIST_CHANGE_EVENT = "titan-wishlist-change";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeWishlist(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(WISHLIST_CHANGE_EVENT));
}

export function toggleWishlist(productId: string): boolean {
  const current = readWishlist();
  const saved = current.includes(productId);
  writeWishlist(
    saved ? current.filter((id) => id !== productId) : [...current, productId],
  );
  return !saved;
}

export function clearWishlist() {
  writeWishlist([]);
}
