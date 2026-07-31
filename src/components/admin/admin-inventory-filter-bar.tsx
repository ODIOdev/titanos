"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  INVENTORY_DEFAULT_SORT,
  INVENTORY_SORT_OPTIONS,
} from "@/lib/admin/inventory-sort";

type Option = { id: string; name: string };

type FilterState = {
  q: string;
  category: string;
  brand: string;
  stock: string;
  sort: string;
};

type AdminInventoryFilterBarProps = FilterState & {
  categories: Option[];
  brands: Option[];
  hasFilters: boolean;
  clearHref: string;
};

const SELECT_CLASS =
  "flex h-10 w-full appearance-none rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40";

function buildQuery(state: FilterState) {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.category) params.set("category", state.category);
  if (state.brand) params.set("brand", state.brand);
  if (state.stock && state.stock !== "all") params.set("stock", state.stock);
  if (state.sort && state.sort !== INVENTORY_DEFAULT_SORT) {
    params.set("sort", state.sort);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function AdminInventoryFilterBar({
  q,
  category,
  brand,
  stock,
  sort,
  categories,
  brands,
  hasFilters,
  clearHref,
}: AdminInventoryFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const urlState: FilterState = { q, category, brand, stock, sort };
  const urlKey = buildQuery(urlState);
  const [state, setState] = useState<FilterState>(urlState);
  const [syncedKey, setSyncedKey] = useState(urlKey);
  const [ownKey, setOwnKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adopt the URL when something else changes it (category tiles, KPI tiles,
  // clear). Skip our own navigations so a slow route update can't overwrite
  // characters typed since the search debounce fired.
  if (urlKey !== syncedKey) {
    setSyncedKey(urlKey);
    if (urlKey !== ownKey) setState(urlState);
  }

  function navigate(next: FilterState) {
    const key = buildQuery(next);
    setOwnKey(key);
    startTransition(() => {
      router.replace(pathname + key, { scroll: false });
    });
  }

  function update(patch: Partial<FilterState>) {
    const next = { ...state, ...patch };
    setState(next);
    navigate(next);
  }

  useEffect(() => {
    if (state.q === q) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(state), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, q, pathname, router]);

  return (
    <form
      className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate(state);
      }}
    >
      <div className="min-w-[12rem] flex-1 lg:max-w-xs">
        <Input
          name="q"
          type="search"
          label="Search"
          placeholder="Name, SKU, brand, category…"
          value={state.q}
          onChange={(e) =>
            setState((prev) => ({ ...prev, q: e.target.value }))
          }
          aria-label="Search inventory"
          aria-busy={pending || undefined}
        />
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-[12rem]">
        <label
          htmlFor="inventory-category"
          className="mb-1.5 block text-sm font-medium text-dark-charcoal"
        >
          Category
        </label>
        <select
          id="inventory-category"
          value={state.category}
          onChange={(e) => update({ category: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-[12rem]">
        <label
          htmlFor="inventory-brand"
          className="mb-1.5 block text-sm font-medium text-dark-charcoal"
        >
          Brand
        </label>
        <select
          id="inventory-brand"
          value={state.brand}
          onChange={(e) => update({ brand: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
        <label
          htmlFor="inventory-stock"
          className="mb-1.5 block text-sm font-medium text-dark-charcoal"
        >
          Stock
        </label>
        <select
          id="inventory-stock"
          value={state.stock}
          onChange={(e) => update({ stock: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="all">All stock</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-[12rem]">
        <label
          htmlFor="inventory-sort"
          className="mb-1.5 block text-sm font-medium text-dark-charcoal"
        >
          Sort
        </label>
        <select
          id="inventory-sort"
          value={state.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className={SELECT_CLASS}
        >
          {INVENTORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {hasFilters ? (
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
