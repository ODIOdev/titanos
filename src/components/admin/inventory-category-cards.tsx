"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { withAdminReturn } from "@/lib/admin/return-to";
import { cn, formatCurrency } from "@/lib/utils";

/** Category status gauges fill completely at this many units on hand. */
export const CATEGORY_UNIT_CAP = 100;

const GAUGE_RADIUS = 15.5;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export type InventoryStockState = "ok" | "low" | "out";

export type InventoryCategoryProduct = {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  imageUrl: string;
  quantity: number;
  threshold: number;
  value: number;
  state: InventoryStockState;
};

export type InventoryCategoryStat = {
  id: string;
  name: string;
  skuCount: number;
  units: number;
  value: number;
  ok: number;
  low: number;
  out: number;
  /** Units on hand split by stock state, used to weight the gauge segments. */
  okUnits: number;
  lowUnits: number;
  products: InventoryCategoryProduct[];
};

const STATE_ORDER: Record<InventoryStockState, number> = {
  out: 0,
  low: 1,
  ok: 2,
};

/**
 * Ring gauge of units on hand against CATEGORY_UNIT_CAP, split into the units
 * sitting in healthy vs low stock. Out-of-stock items contribute no units.
 */
function StockGauge({
  stat,
  fill,
  className,
  valueClassName,
}: {
  stat: InventoryCategoryStat;
  fill: number;
  className?: string;
  valueClassName?: string;
}) {
  const arc = GAUGE_CIRCUMFERENCE * fill;
  const okLength = stat.units > 0 ? arc * (stat.okUnits / stat.units) : 0;
  const lowLength = stat.units > 0 ? arc * (stat.lowUnits / stat.units) : 0;

  return (
    <div className={cn("relative size-12 shrink-0", className)}>
      <svg
        viewBox="0 0 36 36"
        className="size-full -rotate-90"
        role="img"
        aria-label={`${stat.units} units on hand of a ${CATEGORY_UNIT_CAP} unit cap`}
      >
        <circle
          cx="18"
          cy="18"
          r={GAUGE_RADIUS}
          strokeWidth="4"
          className="fill-none stroke-light-gray"
        />
        {lowLength > 0 ? (
          <circle
            cx="18"
            cy="18"
            r={GAUGE_RADIUS}
            strokeWidth="4"
            strokeDasharray={`${lowLength} ${GAUGE_CIRCUMFERENCE - lowLength}`}
            strokeDashoffset={-okLength}
            className="fill-none stroke-amber-500"
          />
        ) : null}
        {okLength > 0 ? (
          <circle
            cx="18"
            cy="18"
            r={GAUGE_RADIUS}
            strokeWidth="4"
            strokeDasharray={`${okLength} ${GAUGE_CIRCUMFERENCE - okLength}`}
            className="fill-none stroke-emerald-500"
          />
        ) : null}
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-heading text-[11px] font-semibold tabular-nums text-dark-charcoal",
          valueClassName,
        )}
      >
        {Math.round(fill * 100)}%
      </span>
    </div>
  );
}

function StatusBadge({ state }: { state: InventoryStockState }) {
  if (state === "out") return <Badge variant="warning">Out of stock</Badge>;
  if (state === "low") return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">OK</Badge>;
}

function CategoryCard({
  stat,
  onOpen,
}: {
  stat: InventoryCategoryStat;
  onOpen: () => void;
}) {
  const atCap = stat.units >= CATEGORY_UNIT_CAP;
  const fill = Math.min(1, stat.units / CATEGORY_UNIT_CAP);
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
      className="group relative w-full overflow-hidden rounded-sm border border-border-gray bg-white py-3 pl-4 pr-3 text-left transition-colors hover:border-dark-charcoal/40"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", railClass)}
        aria-hidden="true"
      />

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-xs font-semibold uppercase tracking-[0.1em] text-medium-gray">
            {stat.name}
          </p>
          <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight text-dark-charcoal">
            {stat.units.toLocaleString()}
            <span className="ml-1 text-[11px] font-medium uppercase tracking-wide text-medium-gray">
              units
            </span>
          </p>
          <p className="text-[11px] tabular-nums text-medium-gray">
            {stat.skuCount} SKU{stat.skuCount === 1 ? "" : "s"} ·{" "}
            {formatCurrency(stat.value)}
          </p>
        </div>
        <StockGauge stat={stat} fill={fill} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-gray pt-2 text-[11px] tabular-nums text-medium-gray">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
        </span>
        {atCap ? (
          <span className="shrink-0 font-medium text-emerald-700">At cap</span>
        ) : null}
      </div>
    </button>
  );
}

function CategoryProductsDialog({
  stat,
  onClose,
}: {
  stat: InventoryCategoryStat;
  onClose: () => void;
}) {
  // Surface the problems first: out of stock, then low, then by smallest count.
  const rows = React.useMemo(
    () =>
      [...stat.products].sort(
        (a, b) =>
          STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
          a.quantity - b.quantity ||
          a.name.localeCompare(b.name),
      ),
    [stat.products],
  );

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={stat.name}
      description={`${stat.skuCount} SKU${
        stat.skuCount === 1 ? "" : "s"
      } · ${stat.units.toLocaleString()} units · ${formatCurrency(
        stat.value,
      )} stock value`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-sm border border-border-gray bg-light-gray/40 px-4 py-3">
          <StockGauge
            stat={stat}
            fill={Math.min(1, stat.units / CATEGORY_UNIT_CAP)}
            className="size-14"
            valueClassName="text-xs"
          />
          <dl className="grid flex-1 grid-cols-3 gap-3 text-center">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                In stock
              </dt>
              <dd className="font-heading text-lg font-semibold tabular-nums text-emerald-700">
                {stat.ok}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                Low
              </dt>
              <dd
                className={cn(
                  "font-heading text-lg font-semibold tabular-nums",
                  stat.low > 0 ? "text-amber-700" : "text-medium-gray",
                )}
              >
                {stat.low}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                Out
              </dt>
              <dd
                className={cn(
                  "font-heading text-lg font-semibold tabular-nums",
                  stat.out > 0 ? "text-red-700" : "text-medium-gray",
                )}
              >
                {stat.out}
              </dd>
            </div>
          </dl>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-medium-gray">
            No products in this category.
          </p>
        ) : (
          <ul className="-mx-1 max-h-[52vh] divide-y divide-border-gray overflow-y-auto px-1">
            {rows.map((product) => (
              <li key={product.id}>
                <Link
                  href={withAdminReturn(
                    `/admin/products/${product.id}`,
                    "inventory",
                  )}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-light-gray/60"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized={
                        product.imageUrl.startsWith("data:") ||
                        product.imageUrl.startsWith("blob:")
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dark-charcoal">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-medium-gray">
                      {product.sku ?? "—"}
                      {product.brand ? ` · ${product.brand}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        product.state === "out"
                          ? "text-red-700"
                          : product.state === "low"
                            ? "text-warning-orange"
                            : "text-dark-charcoal",
                      )}
                    >
                      {product.quantity.toLocaleString()}
                      <span className="ml-1 text-[11px] font-medium uppercase text-medium-gray">
                        on hand
                      </span>
                    </p>
                    <p className="text-xs tabular-nums text-medium-gray">
                      {formatCurrency(product.value)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    <StatusBadge state={product.state} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

export function InventoryCategoryCards({
  stats,
}: {
  stats: InventoryCategoryStat[];
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const openStat = stats.find((stat) => stat.id === openId) ?? null;

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <CategoryCard
            key={stat.id}
            stat={stat}
            onOpen={() => setOpenId(stat.id)}
          />
        ))}
      </div>

      {openStat ? (
        <CategoryProductsDialog
          stat={openStat}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}

/** Category grid for embedding (e.g. department popup). */
export function InventoryCategoryCardsGrid({
  stats,
  onOpenCategory,
}: {
  stats: InventoryCategoryStat[];
  onOpenCategory: (stat: InventoryCategoryStat) => void;
}) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-medium-gray">
        No categories in this department.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {stats.map((stat) => (
        <CategoryCard
          key={stat.id}
          stat={stat}
          onOpen={() => onOpenCategory(stat)}
        />
      ))}
    </div>
  );
}

export { CategoryProductsDialog };
