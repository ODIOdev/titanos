"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/providers/cart-provider";

export function CartButton({ className }: { className?: string }) {
  const { itemCount, isHydrated } = useCart();
  const count = isHydrated ? itemCount : 0;

  return (
    <Link
      href="/cart"
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal transition-colors hover:bg-light-gray",
        className
      )}
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingCart className="size-5" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-titan-yellow px-1 text-[10px] font-bold leading-none text-dark-charcoal">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
