"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WISHLIST_STORAGE_KEY = "titan-wishlist";

function readWishlist(): string[] {
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

function writeWishlist(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("titan-wishlist-change"));
}

export type WishlistButtonProps = {
  productId: string;
  productName?: string;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistButton({
  productId,
  productName,
  className,
  size = "md",
}: WishlistButtonProps) {
  const [active, setActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function sync() {
      setActive(readWishlist().includes(productId));
      setHydrated(true);
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("titan-wishlist-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("titan-wishlist-change", sync);
    };
  }, [productId]);

  function toggle() {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];

    writeWishlist(next);
    setActive(next.includes(productId));

    const label = productName ?? "Product";
    if (next.includes(productId)) {
      toast.success(`${label} saved to wishlist.`);
    } else {
      toast.message(`${label} removed from wishlist.`);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      disabled={!hydrated}
      className={cn(
        "inline-flex items-center justify-center rounded-sm border border-border-gray text-dark-charcoal transition-colors hover:bg-light-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow disabled:opacity-50",
        size === "sm" ? "size-8" : "size-9",
        active && "border-titan-yellow bg-titan-yellow/15",
        className,
      )}
    >
      <Heart
        className={cn(
          size === "sm" ? "size-4" : "size-5",
          active && "fill-titan-yellow text-titan-yellow",
        )}
        aria-hidden="true"
      />
    </button>
  );
}
