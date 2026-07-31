"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  WISHLIST_CHANGE_EVENT,
  readWishlist,
  toggleWishlist,
} from "@/lib/wishlist";
import { cn } from "@/lib/utils";

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
    window.addEventListener(WISHLIST_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WISHLIST_CHANGE_EVENT, sync);
    };
  }, [productId]);

  function toggle() {
    const saved = toggleWishlist(productId);
    setActive(saved);

    const label = productName ?? "Product";
    if (saved) {
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
