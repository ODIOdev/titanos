"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
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
  counts?: { all: number; ok: number; low: number; out: number };
};

const SELECT_CLASS =
  "h-9 w-full appearance-none rounded-sm border border-border-gray bg-white px-2.5 text-xs text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40";

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
  counts,
}: AdminProductsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const [category, setCategory] = useState(categoryId);
  const [brand, setBrand] = useState(brandId);
  const [stockFilter, setStockFilter] = useState(stock);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [query, q, tab, category, brand, stockFilter, pathname, router]);

  const stockChips = [
    { value: "all" as const, label: "All", count: counts?.all },
    { value: "ok" as const, label: "In stock", count: counts?.ok },
    {
      value: "low" as const,
      label: "Low",
      count: counts?.low,
      alert: (counts?.low ?? 0) > 0,
    },
    {
      value: "out" as const,
      label: "Out",
      count: counts?.out,
      alert: (counts?.out ?? 0) > 0,
    },
  ];

  if (compact) {
    return (
      <form
        className="grid grid-cols-2 gap-2"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (debounceRef.current) clearTimeout(debounceRef.current);
          navigate({ q: query });
        }}
      >
        <div className="relative col-span-2">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-medium-gray"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            placeholder="Name, SKU, brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            aria-busy={pending || undefined}
            className="flex h-9 w-full rounded-sm border border-border-gray bg-white py-2 pl-8 pr-3 text-sm text-near-black placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
          />
        </div>
        <select
          name="category"
          value={category}
          aria-label="Category"
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);
            navigate({ category: value, q: query });
          }}
          className={SELECT_CLASS}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="brand"
          value={brand}
          aria-label="Brand"
          onChange={(e) => {
            const value = e.target.value;
            setBrand(value);
            navigate({ brand: value, q: query });
          }}
          className={SELECT_CLASS}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          name="stock"
          value={stockFilter}
          aria-label="Stock"
          onChange={(e) => {
            const value = e.target.value as typeof stockFilter;
            setStockFilter(value);
            navigate({ stock: value, q: query });
          }}
          className={cn(SELECT_CLASS, "col-span-2")}
        >
          <option value="all">All stock</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </form>
    );
  }

  return (
    <form
      className="space-y-2.5"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate({ q: query });
      }}
    >
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Stock status"
      >
        {stockChips.map((chip) => {
          const active = stockFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setStockFilter(chip.value);
                navigate({ stock: chip.value, q: query });
              }}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "border-dark-charcoal bg-dark-charcoal text-white"
                  : "border-border-gray bg-white text-medium-gray hover:border-dark-charcoal/40 hover:text-dark-charcoal",
                !active && chip.alert && "border-amber-300 text-amber-800",
              )}
            >
              {chip.label}
              {chip.count != null ? (
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-white/70" : "text-dark-charcoal/50",
                  )}
                >
                  {chip.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-medium-gray"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            placeholder="Search name, SKU, brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            aria-busy={pending || undefined}
            className="flex h-9 w-full rounded-sm border border-border-gray bg-white py-2 pl-8 pr-3 text-sm text-near-black placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:w-auto">
          <label className="sr-only" htmlFor="products-category">
            Category
          </label>
          <select
            id="products-category"
            name="category"
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              setCategory(value);
              navigate({ category: value, q: query });
            }}
            className={cn(SELECT_CLASS, "lg:w-[10.5rem]")}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="products-brand">
            Brand
          </label>
          <select
            id="products-brand"
            name="brand"
            value={brand}
            onChange={(e) => {
              const value = e.target.value;
              setBrand(value);
              navigate({ brand: value, q: query });
            }}
            className={cn(SELECT_CLASS, "lg:w-[9.5rem]")}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {hasFilters ? (
          <Link
            href={clearHref}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-sm border border-border-gray bg-white px-2.5 text-xs font-semibold uppercase tracking-wide text-medium-gray transition-colors hover:border-dark-charcoal/40 hover:text-dark-charcoal"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
