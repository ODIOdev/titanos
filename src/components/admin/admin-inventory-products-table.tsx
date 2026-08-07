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
          { key: "product", header: "Product", className: "w-[22%]" },
          {
            key: "sku",
            header: "SKU",
            className: "w-[14%] overflow-visible",
          },
          {
            key: "category",
            header: "Category",
            className: "w-[14%] overflow-visible",
          },
          { key: "qty", header: "On hand", className: "w-[14%]" },
          { key: "value", header: "Value", className: "w-[8%]" },
          { key: "status", header: "Status", className: "w-[7%]" },
          {
            key: "actions",
            header: "Actions",
            className: "w-[24%] min-w-[14rem] overflow-visible text-right",
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
              </p>
            </div>
          </div>,
          <span
            key={`${p.id}-sku`}
            className="block whitespace-normal break-all font-mono text-xs leading-snug line-clamp-2"
            title={p.sku || undefined}
          >
            {p.sku || "—"}
          </span>,
          <span
            key={`${p.id}-cat`}
            className="block whitespace-normal break-words leading-snug line-clamp-2"
            title={p.categoryName ?? undefined}
          >
            {p.categoryName ?? "—"}
          </span>,
          <div key={`${p.id}-qty`} className="min-w-0">
            <span
              className={cn(
                "font-semibold tabular-nums",
                p.stockState === "out" && "text-red-700",
                p.stockState === "low" && "text-warning-orange",
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
            ) : null}
          </div>,
          <span key={`${p.id}-value`} className="font-semibold tabular-nums">
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
            className="flex w-full flex-row flex-nowrap items-center justify-end gap-1.5"
            data-no-row-nav
          >
            <div className="shrink-0">
              <BuildProductButton productId={p.id} productName={p.name} />
            </div>
            <Link
              href={p.editHref}
              className="inline-flex h-8 shrink-0 items-center rounded-sm border border-border-gray px-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
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
