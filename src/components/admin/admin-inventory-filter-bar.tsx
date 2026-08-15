"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  INVENTORY_DEFAULT_SORT,
  INVENTORY_SORT_OPTIONS,
} from "@/lib/admin/inventory-sort";
import { cn } from "@/lib/utils";

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
  counts?: { all: number; ok: number; low: number; out: number };
};

const SELECT_CLASS =
  "h-9 w-full appearance-none rounded-sm border border-border-gray bg-white px-2.5 text-xs text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40";

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
  counts,
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

  const stockChips = [
    { value: "all", label: "All", count: counts?.all },
    { value: "ok", label: "In stock", count: counts?.ok },
    { value: "low", label: "Low", count: counts?.low, alert: (counts?.low ?? 0) > 0 },
    { value: "out", label: "Out", count: counts?.out, alert: (counts?.out ?? 0) > 0 },
  ] as const;

  return (
    <form
      className="space-y-2.5"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate(state);
      }}
    >
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Stock status"
      >
        {stockChips.map((chip) => {
          const active = state.stock === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => update({ stock: chip.value })}
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
            value={state.q}
            onChange={(e) =>
              setState((prev) => ({ ...prev, q: e.target.value }))
            }
            aria-label="Search inventory"
            aria-busy={pending || undefined}
            className="flex h-9 w-full rounded-sm border border-border-gray bg-white py-2 pl-8 pr-3 text-sm text-near-black placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:w-auto">
          <label className="sr-only" htmlFor="inventory-category">
            Category
          </label>
          <select
            id="inventory-category"
            value={state.category}
            onChange={(e) => update({ category: e.target.value })}
            className={cn(SELECT_CLASS, "lg:w-[10.5rem]")}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="inventory-brand">
            Brand
          </label>
          <select
            id="inventory-brand"
            value={state.brand}
            onChange={(e) => update({ brand: e.target.value })}
            className={cn(SELECT_CLASS, "lg:w-[9.5rem]")}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="inventory-sort">
            Sort
          </label>
          <select
            id="inventory-sort"
            value={state.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className={cn(SELECT_CLASS, "col-span-2 sm:col-span-1 lg:w-[9.5rem]")}
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
