"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CategoryProductsDialog,
  InventoryCategoryCardsGrid,
  type InventoryCategoryStat,
} from "@/components/admin/inventory-category-cards";
import { Dialog } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

export type InventoryDepartmentStat = {
  id: string;
  name: string;
  skuCount: number;
  units: number;
  value: number;
  ok: number;
  low: number;
  out: number;
  categoryCount: number;
  categories: InventoryCategoryStat[];
};

function DepartmentCard({
  stat,
  onOpen,
}: {
  stat: InventoryDepartmentStat;
  onOpen: () => void;
}) {
  const railClass =
    stat.out > 0
      ? "bg-red-500"
      : stat.low > 0
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group relative w-[min(100%,16.5rem)] shrink-0 snap-start overflow-hidden rounded-sm border border-border-gray bg-white py-3 pl-4 pr-3 text-left transition-colors hover:border-dark-charcoal/40"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", railClass)}
        aria-hidden="true"
      />
      <p className="truncate font-heading text-xs font-semibold uppercase tracking-[0.1em] text-medium-gray">
        {stat.name}
      </p>
      <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight text-dark-charcoal">
        {stat.units.toLocaleString()}
        <span className="ml-1 text-[11px] font-medium uppercase tracking-wide text-medium-gray">
          units
        </span>
      </p>
      <p className="mt-1 text-[11px] tabular-nums text-medium-gray">
        {stat.categoryCount} categor
        {stat.categoryCount === 1 ? "y" : "ies"} · {stat.skuCount} SKU
        {stat.skuCount === 1 ? "" : "s"}
      </p>
      <p className="text-[11px] tabular-nums text-medium-gray">
        {formatCurrency(stat.value)}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border-gray pt-2 text-[11px] tabular-nums text-medium-gray">
        <span className="inline-flex items-center gap-1">
          <span
            className="size-1.5 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          {stat.ok} ok
        </span>
        {stat.low > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <span
              className="size-1.5 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            {stat.low} low
          </span>
        ) : null}
        {stat.out > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-red-700">
            <span
              className="size-1.5 rounded-full bg-red-500"
              aria-hidden="true"
            />
            {stat.out} out
          </span>
        ) : null}
      </div>
    </button>
  );
}

function DepartmentCategoriesDialog({
  department,
  onClose,
}: {
  department: InventoryDepartmentStat;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const openCategory =
    department.categories.find((c) => c.id === categoryId) ?? null;

  return (
    <>
      <Dialog
        open
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={department.name}
        description={`${department.categoryCount} categor${
          department.categoryCount === 1 ? "y" : "ies"
        } · ${department.skuCount} SKU${
          department.skuCount === 1 ? "" : "s"
        } · ${department.units.toLocaleString()} units · ${formatCurrency(
          department.value,
        )}`}
        className="max-w-3xl"
      >
        <InventoryCategoryCardsGrid
          stats={department.categories}
          onOpenCategory={(stat) => setCategoryId(stat.id)}
        />
      </Dialog>

      {openCategory ? (
        <CategoryProductsDialog
          stat={openCategory}
          onClose={() => setCategoryId(null)}
        />
      ) : null}
    </>
  );
}

/** Horizontal carousel of active departments → popup of category cards. */
export function InventoryDepartmentCarousel({
  departments,
}: {
  departments: InventoryDepartmentStat[];
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const openDepartment =
    departments.find((d) => d.id === openId) ?? null;

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }

  React.useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [departments]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (departments.length === 0) return null;

  return (
    <>
      <div className="relative">
        {canPrev ? (
          <button
            type="button"
            aria-label="Previous departments"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm border border-border-gray bg-white/95 text-dark-charcoal shadow-sm hover:bg-light-gray"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            aria-label="Next departments"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm border border-border-gray bg-white/95 text-dark-charcoal shadow-sm hover:bg-light-gray"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {departments.map((stat) => (
            <DepartmentCard
              key={stat.id}
              stat={stat}
              onOpen={() => setOpenId(stat.id)}
            />
          ))}
        </div>
      </div>

      {openDepartment ? (
        <DepartmentCategoriesDialog
          department={openDepartment}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
