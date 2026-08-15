"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminProductPreviewDialog,
  type AdminProductPreview,
} from "@/components/admin/admin-product-preview-dialog";
import { BuildProductButton } from "@/components/admin/build-product-button";
import { DataTable } from "@/components/admin/data-table";
import { ReplenishProductButton } from "@/components/admin/replenish-product-button";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminInventoryTableRow = AdminProductPreview & {
  stockValue: number;
  stockState: "ok" | "low" | "out";
};

function stockFillPercent(qty: number, threshold: number, state: string) {
  if (state === "out") return 0;
  if (threshold <= 0) return state === "ok" ? 100 : 35;
  // Treat ~3× threshold as a full bar so healthy stock reads full.
  const fullAt = Math.max(threshold * 3, threshold + 1);
  return Math.min(100, Math.round((qty / fullAt) * 100));
}

function StockBadge({ state }: { state: "ok" | "low" | "out" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        state === "out" && "bg-red-100 text-red-800",
        state === "low" && "bg-amber-100 text-amber-900",
        state === "ok" && "bg-emerald-100 text-emerald-800",
      )}
    >
      {state === "out" ? "Out" : state === "low" ? "Low" : "OK"}
    </span>
  );
}

export function AdminInventoryProductsTable({
  products,
  emptyMessage,
}: {
  products: AdminInventoryTableRow[];
  emptyMessage: string;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = useMemo(
    () => products.find((p) => p.id === previewId) ?? null,
    [products, previewId],
  );

  return (
    <>
      <DataTable
        className="rounded-none border-0"
        noHorizontalScroll
        emptyMessage={emptyMessage}
        onRowActivate={(index) => {
          const id = products[index]?.id;
          if (id) setPreviewId(id);
        }}
        columns={[
          { key: "product", header: "Product", className: "w-[28%]" },
          {
            key: "sku",
            header: "SKU",
            className: "w-[12%] overflow-visible",
          },
          {
            key: "category",
            header: "Category",
            className: "w-[12%] overflow-visible",
          },
          { key: "qty", header: "On hand", className: "w-[18%]" },
          { key: "value", header: "Value", className: "w-[8%]" },
          { key: "status", header: "Status", className: "w-[7%]" },
          {
            key: "actions",
            header: "Actions",
            className: "w-[15%] min-w-[11rem] overflow-visible text-right",
          },
        ]}
        rows={products.map((p) => {
          const fill = stockFillPercent(
            p.inventoryQuantity,
            p.lowStockThreshold,
            p.stockState,
          );
          return [
            <div
              key={`${p.id}-product`}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                <Image
                  src={p.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={
                    p.imageUrl.startsWith("data:") ||
                    p.imageUrl.startsWith("blob:")
                  }
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-dark-charcoal">
                  {p.name}
                </p>
                <p className="truncate text-[11px] text-medium-gray">
                  {p.brandName ?? "No brand"}
                </p>
              </div>
            </div>,
            <span
              key={`${p.id}-sku`}
              className="block whitespace-normal break-all font-mono text-[11px] leading-snug text-dark-charcoal/80 line-clamp-2"
              title={p.sku || undefined}
            >
              {p.sku || "—"}
            </span>,
            <span
              key={`${p.id}-cat`}
              className="block whitespace-normal break-words text-xs leading-snug text-dark-charcoal/80 line-clamp-2"
              title={p.categoryName ?? undefined}
            >
              {p.categoryName ?? "—"}
            </span>,
            <div key={`${p.id}-qty`} className="min-w-0 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex min-w-[2rem] items-center justify-center rounded-sm px-1.5 py-0.5 text-sm font-bold tabular-nums",
                    p.stockState === "out" && "bg-red-100 text-red-800",
                    p.stockState === "low" && "bg-amber-100 text-amber-900",
                    p.stockState === "ok" && "bg-emerald-100 text-emerald-900",
                  )}
                >
                  {p.inventoryQuantity}
                </span>
                <span className="text-[10px] tabular-nums text-medium-gray">
                  thr {p.lowStockThreshold}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-light-gray">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    p.stockState === "out" && "bg-red-500",
                    p.stockState === "low" && "bg-amber-500",
                    p.stockState === "ok" && "bg-emerald-500",
                  )}
                  style={{ width: `${Math.max(fill, p.stockState === "out" ? 0 : 4)}%` }}
                />
              </div>
              {p.stockSizes && p.stockSizes.length > 0 ? (
                <ul className="flex flex-wrap gap-1">
                  {p.stockSizes.map((row) => (
                    <li
                      key={`${p.id}-${row.size}`}
                      className="rounded-sm bg-light-gray px-1.5 py-0.5 text-[10px] tabular-nums text-dark-charcoal"
                    >
                      <span className="font-semibold">{row.size}</span>
                      <span className="text-medium-gray"> {row.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>,
            <span
              key={`${p.id}-value`}
              className="text-sm font-semibold tabular-nums text-dark-charcoal"
            >
              {formatCurrency(p.stockValue)}
            </span>,
            <StockBadge key={`${p.id}-st`} state={p.stockState} />,
            <div
              key={`${p.id}-actions`}
              className="flex w-full flex-row flex-nowrap items-center justify-end gap-1"
              data-no-row-nav
            >
              <div className="shrink-0">
                <BuildProductButton productId={p.id} productName={p.name} />
              </div>
              <Link
                href={p.editHref}
                className="inline-flex h-8 shrink-0 items-center rounded-sm border border-border-gray px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-light-gray"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
              <div className="shrink-0">
                <ReplenishProductButton
                  productId={p.id}
                  productName={p.name}
                  currentQty={p.inventoryQuantity}
                />
              </div>
            </div>,
          ];
        })}
      />

      <AdminProductPreviewDialog
        product={preview}
        open={previewId != null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </>
  );
}
