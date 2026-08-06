"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive,
  FilePenLine,
  Package,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdminProductsFilterBar } from "@/components/admin/admin-products-filter-bar";
import { cn } from "@/lib/utils";

type TabId = "active" | "draft" | "archived";
type StockFilter = "all" | "low" | "out" | "ok";
type StatusKind = "products" | "drafts" | "archived" | "lowStock";

export type ProductsMobileStatusChip = {
  kind: StatusKind;
  href: string;
  label: string;
  count: number;
  active: boolean;
  alert?: boolean;
};

type Option = { id: string; name: string };

type ProductsMobileChromeProps = {
  title: string;
  description: string;
  itemCount: number;
  rangeLabel: string;
  statusChips: ProductsMobileStatusChip[];
  tab: TabId;
  q: string;
  categoryId: string;
  brandId: string;
  stock: StockFilter;
  categories: Option[];
  brands: Option[];
  hasFilters: boolean;
  clearHref: string;
  isEmptyCatalog: boolean;
};

const STATUS_ICONS: Record<StatusKind, LucideIcon> = {
  products: Package,
  drafts: FilePenLine,
  archived: Archive,
  lowStock: TriangleAlert,
};

/**
 * Mobile-only products catalog chrome: compact status rail, inline CTA,
 * and filters behind a single tap so the list stays reachable.
 */
export function ProductsMobileChrome({
  title,
  description,
  itemCount,
  rangeLabel,
  statusChips,
  tab,
  q,
  categoryId,
  brandId,
  stock,
  categories,
  brands,
  hasFilters,
  clearHref,
  isEmptyCatalog,
}: ProductsMobileChromeProps) {
  const [filtersOpen, setFiltersOpen] = useState(hasFilters);

  return (
    <div className="products-mobile-chrome space-y-3 @5xl:hidden">
      <div
        className="-mx-4 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Catalog status"
      >
        <ul className="flex w-max gap-2">
          {statusChips.map((chip) => {
            const Icon = STATUS_ICONS[chip.kind];
            return (
              <li key={chip.kind}>
                <Link
                  href={chip.href}
                  aria-current={chip.active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-sm border px-3 py-2 transition-colors",
                    chip.active
                      ? "border-titan-yellow bg-titan-yellow/15 text-dark-charcoal"
                      : "border-border-gray bg-white text-dark-charcoal active:bg-light-gray",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      chip.alert ? "text-orange-700" : "text-medium-gray",
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {chip.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      chip.active
                        ? "bg-titan-yellow/40 text-dark-charcoal"
                        : "bg-light-gray text-medium-gray",
                    )}
                  >
                    {chip.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isEmptyCatalog ? (
        <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="border-b border-border-gray bg-titan-yellow/15 px-4 py-3">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Start your catalog
            </p>
            <p className="mt-0.5 text-xs text-medium-gray">
              Add a product to go live, or restore one from drafts/archive.
            </p>
          </div>
          <div className="space-y-3 p-4">
            <Link
              href="/admin/products/new"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal active:bg-[#e0b400]"
            >
              <Plus className="size-4" aria-hidden="true" />
              New product
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/products?tab=draft"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal active:bg-light-gray"
              >
                <FilePenLine className="size-3.5" aria-hidden="true" />
                Drafts
              </Link>
              <Link
                href="/admin/products?tab=archived"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal active:bg-light-gray"
              >
                <Archive className="size-3.5" aria-hidden="true" />
                Archive
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="overflow-hidden rounded-t-sm border border-border-gray bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 border-b border-border-gray px-3 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
                {title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-medium-gray">
                <span className="tabular-nums text-dark-charcoal">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
                {rangeLabel ? (
                  <span className="tabular-nums"> · {rangeLabel}</span>
                ) : null}
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-sm bg-titan-yellow px-3 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal active:bg-[#e0b400]"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New
            </Link>
          </div>

          <div className="border-b border-border-gray px-3 py-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className={cn(
                  "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wide",
                  filtersOpen || hasFilters
                    ? "border-dark-charcoal bg-dark-charcoal text-white"
                    : "border-border-gray bg-white text-dark-charcoal",
                )}
              >
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Filters
                {hasFilters ? (
                  <span className="rounded-sm bg-titan-yellow px-1.5 py-0.5 text-[10px] font-semibold text-dark-charcoal">
                    On
                  </span>
                ) : null}
              </button>
              {hasFilters ? (
                <Link
                  href={clearHref}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal active:bg-light-gray"
                  aria-label="Clear filters"
                >
                  <X className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            {filtersOpen ? (
              <div className="mt-3 border-t border-border-gray pt-3">
                <p className="mb-2 text-xs text-medium-gray">{description}</p>
                <AdminProductsFilterBar
                  tab={tab}
                  q={q}
                  categoryId={categoryId}
                  brandId={brandId}
                  stock={stock}
                  categories={categories}
                  brands={brands}
                  hasFilters={hasFilters}
                  clearHref={clearHref}
                  compact
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
