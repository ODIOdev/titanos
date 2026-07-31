"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getWishlistProducts } from "@/lib/actions/wishlist";
import {
  WISHLIST_CHANGE_EVENT,
  clearWishlist,
  readWishlist,
} from "@/lib/wishlist";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

/** Saved products live in localStorage, so the list always renders client-side. */
export function WishlistView({ className }: { className?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const ids = readWishlist();
      if (ids.length === 0) {
        if (active) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const results = await getWishlistProducts(ids);
        // Most recently saved first.
        const order = new Map(ids.map((id, index) => [id, index]));
        results.sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));
        if (active) setProducts(results);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    window.addEventListener("storage", load);
    window.addEventListener(WISHLIST_CHANGE_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener("storage", load);
      window.removeEventListener(WISHLIST_CHANGE_EVENT, load);
    };
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-sm border border-border-gray bg-light-gray"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("rounded-sm border border-border-gray bg-white", className)}>
        <EmptyState
          icon={<Heart />}
          title="No saved products yet"
          description="Tap the heart on any product to save it here for quick access later."
          action={
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "primary" }))}
            >
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border-gray pb-3">
        <p className="text-sm text-medium-gray">
          <span className="font-semibold text-dark-charcoal tabular-nums">
            {products.length}
          </span>{" "}
          {products.length === 1 ? "saved product" : "saved products"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            clearWishlist();
            toast.message("Wishlist cleared.");
          }}
        >
          <Trash2 className="mr-1 size-4" aria-hidden="true" />
          Clear all
        </Button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} priority={index < 4} />
          </li>
        ))}
      </ul>
    </div>
  );
}
