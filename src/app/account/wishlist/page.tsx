"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { buttonVariants } from "@/components/ui/button";
import { getWishlistProducts } from "@/lib/actions/wishlist";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

const WISHLIST_STORAGE_KEY = "titan-wishlist";

function readWishlistIds(): string[] {
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

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = readWishlistIds();
      if (ids.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const results = await getWishlistProducts(ids);
        if (!cancelled) {
          setProducts(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
      }
    }

    function onChange() {
      setLoading(true);
      void load();
    }

    void load();
    window.addEventListener("storage", onChange);
    window.addEventListener("titan-wishlist-change", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onChange);
      window.removeEventListener("titan-wishlist-change", onChange);
    };
  }, []);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Wishlist
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Products saved on this device for later.
      </p>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-sm bg-white" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border-gray bg-white">
          <EmptyState
            icon={<Heart />}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for quick access later."
            action={
              <Link href="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
                Browse products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
