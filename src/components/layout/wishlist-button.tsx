"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { WISHLIST_CHANGE_EVENT, readWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

/** Header entry point to the saved-products list, with a live count badge. */
export function WishlistHeaderButton({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(readWishlist().length);
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WISHLIST_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WISHLIST_CHANGE_EVENT, sync);
    };
  }, []);

  return (
    <Link
      href="/wishlist"
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal transition-colors",
        className,
      )}
      aria-label={count > 0 ? `Wishlist, ${count} products` : "Wishlist"}
    >
      <Heart
        className={cn("size-5", count > 0 && "fill-titan-yellow text-titan-yellow")}
        aria-hidden="true"
      />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-titan-yellow px-1 text-[10px] font-bold leading-none text-dark-charcoal">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
