"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminProductPreviewDialog,
  type AdminProductPreview,
} from "@/components/admin/admin-product-preview-dialog";
import { DataTable } from "@/components/admin/data-table";
import { ReplenishProductButton } from "@/components/admin/replenish-product-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminInventoryTableRow = AdminProductPreview & {
  stockValue: number;
  stockState: "ok" | "low" | "out";
};

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
          { key: "product", header: "Product", className: "w-[34%]" },
          { key: "category", header: "Category", className: "w-[12%]" },
          { key: "qty", header: "On hand", className: "w-[22%]" },
          { key: "value", header: "Value", className: "w-[10%]" },
          { key: "status", header: "Status", className: "w-[10%]" },
          {
            key: "actions",
            header: "Actions",
            className: "w-[12%] text-right",
          },
        ]}
        rows={products.map((p) => [
          <div key={`${p.id}-product`} className="flex min-w-0 items-center gap-3">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
              <Image
                src={p.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
                unoptimized={
                  p.imageUrl.startsWith("data:") ||
                  p.imageUrl.startsWith("blob:")
                }
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-dark-charcoal">{p.name}</p>
              <p className="truncate text-xs text-medium-gray">
                {p.brandName ?? "—"}
                {p.sku ? ` · ${p.sku}` : ""}
              </p>
            </div>
          </div>,
          <span key={`${p.id}-cat`} className="block truncate">
            {p.categoryName ?? "—"}
          </span>,
          <div key={`${p.id}-qty`} className="min-w-0">
            <span
              className={cn(
                "tabular-nums",
                p.stockState === "out" && "font-semibold text-red-700",
                p.stockState === "low" && "font-semibold text-warning-orange",
              )}
            >
              {p.inventoryQuantity}
            </span>
            {p.stockSizes && p.stockSizes.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1">
                {p.stockSizes.map((row) => (
                  <li
                    key={`${p.id}-${row.size}`}
                    className="rounded-sm border border-border-gray bg-light-gray px-1.5 py-0.5 text-[11px] tabular-nums text-dark-charcoal"
                  >
                    <span className="font-medium">{row.size}</span>
                    <span className="text-medium-gray">:{row.qty}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-[11px] text-medium-gray">
                ≤ {p.lowStockThreshold} alert
              </p>
            )}
          </div>,
          <span key={`${p.id}-value`} className="tabular-nums">
            {formatCurrency(p.stockValue)}
          </span>,
          p.stockState === "out" ? (
            <Badge key={`${p.id}-st`} variant="warning">
              Out
            </Badge>
          ) : p.stockState === "low" ? (
            <Badge key={`${p.id}-st`} variant="warning">
              Low
            </Badge>
          ) : (
            <Badge key={`${p.id}-st`} variant="success">
              OK
            </Badge>
          ),
          <div
            key={`${p.id}-actions`}
            className="flex flex-wrap justify-end gap-1.5"
            data-no-row-nav
          >
            <Link
              href={p.editHref}
              className="inline-flex h-8 items-center rounded-sm border border-border-gray px-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
              onClick={(e) => e.stopPropagation()}
            >
              Edit
            </Link>
            <ReplenishProductButton
              productId={p.id}
              productName={p.name}
              currentQty={p.inventoryQuantity}
            />
          </div>,
        ])}
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
