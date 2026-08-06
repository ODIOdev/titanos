"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

type AdminProductsFilterBarProps = {
  tab: "active" | "draft" | "archived";
  q: string;
  categoryId: string;
  brandId: string;
  stock: "all" | "low" | "out" | "ok";
  categories: Option[];
  brands: Option[];
  hasFilters: boolean;
  clearHref: string;
  /** Tighter layout for mobile filter drawer. */
  compact?: boolean;
};

function buildQuery(opts: {
  tab: string;
  q: string;
  category: string;
  brand: string;
  stock: string;
}) {
  const params = new URLSearchParams();
  if (opts.tab && opts.tab !== "active") params.set("tab", opts.tab);
  if (opts.q.trim()) params.set("q", opts.q.trim());
  if (opts.category) params.set("category", opts.category);
  if (opts.brand) params.set("brand", opts.brand);
  if (opts.stock && opts.stock !== "all") params.set("stock", opts.stock);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function AdminProductsFilterBar({
  tab,
  q,
  categoryId,
  brandId,
  stock,
  categories,
  brands,
  hasFilters,
  clearHref,
  compact = false,
}: AdminProductsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const [category, setCategory] = useState(categoryId);
  const [brand, setBrand] = useState(brandId);
  const [stockFilter, setStockFilter] = useState(stock);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local state in sync when URL changes (tabs, clear, etc.)
  useEffect(() => {
    setQuery(q);
    setCategory(categoryId);
    setBrand(brandId);
    setStockFilter(stock);
  }, [q, categoryId, brandId, stock]);

  function navigate(next: {
    q?: string;
    category?: string;
    brand?: string;
    stock?: string;
  }) {
    const href =
      pathname +
      buildQuery({
        tab,
        q: next.q ?? query,
        category: next.category ?? category,
        brand: next.brand ?? brand,
        stock: next.stock ?? stockFilter,
      });
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  useEffect(() => {
    if (query === q) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const href =
        pathname +
        buildQuery({
          tab,
          q: query,
          category,
          brand,
          stock: stockFilter,
        });
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    query,
    q,
    tab,
    category,
    brand,
    stockFilter,
    pathname,
    router,
  ]);

  return (
    <form
      className={cn(
        compact
          ? "grid grid-cols-2 gap-2"
          : "flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end",
      )}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate({ q: query });
      }}
    >
      <div
        className={cn(
          compact ? "col-span-2" : "min-w-[12rem] flex-1 lg:max-w-xs",
        )}
      >
        <Input
          name="q"
          type="search"
          label={compact ? undefined : "Search"}
          placeholder="Name, SKU, brand…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
          aria-busy={pending || undefined}
        />
      </div>
      <div className={cn(!compact && "min-w-[10rem] flex-1 sm:max-w-[12rem]")}>
        {compact ? null : (
          <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
            Category
          </label>
        )}
        <select
          name="category"
          value={category}
          aria-label="Category"
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);
            navigate({ category: value, q: query });
          }}
          className="flex h-10 w-full appearance-none rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className={cn(!compact && "min-w-[10rem] flex-1 sm:max-w-[12rem]")}>
        {compact ? null : (
          <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
            Brand
          </label>
        )}
        <select
          name="brand"
          value={brand}
          aria-label="Brand"
          onChange={(e) => {
            const value = e.target.value;
            setBrand(value);
            navigate({ brand: value, q: query });
          }}
          className="flex h-10 w-full appearance-none rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div
        className={cn(
          compact ? "col-span-2" : "min-w-[9rem] flex-1 sm:max-w-[11rem]",
        )}
      >
        {compact ? null : (
          <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
            Stock
          </label>
        )}
        <select
          name="stock"
          value={stockFilter}
          aria-label="Stock"
          onChange={(e) => {
            const value = e.target.value as typeof stockFilter;
            setStockFilter(value);
            navigate({ stock: value, q: query });
          }}
          className="flex h-10 w-full appearance-none rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
        >
          <option value="all">All stock</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      {!compact && hasFilters ? (
        <Link
          href={clearHref}
          className="inline-flex h-10 shrink-0 items-center px-2 text-sm font-medium text-medium-gray hover:text-dark-charcoal"
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}
