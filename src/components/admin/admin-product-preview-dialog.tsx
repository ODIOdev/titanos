"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ReplenishProductButton } from "@/components/admin/replenish-product-button";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminProductPreview = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  brandName: string | null;
  categoryName: string | null;
  price: number;
  inventoryQuantity: number;
  lowStockThreshold: number;
  stockBySize: string | null;
  /** Per-size on-hand rows when the product uses a size matrix. */
  stockSizes?: { size: string; qty: number }[];
  statusLabel: string;
  statusVariant: "success" | "warning" | "default";
  shortDescription?: string | null;
  editHref: string;
  showReplenish?: boolean;
};

type AdminProductPreviewDialogProps = {
  product: AdminProductPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-dark-charcoal">{children}</dd>
    </div>
  );
}

export function AdminProductPreviewDialog({
  product,
  open,
  onOpenChange,
}: AdminProductPreviewDialogProps) {
  if (!product) return null;

  const low =
    product.inventoryQuantity > 0 &&
    product.inventoryQuantity <= product.lowStockThreshold;
  const out = product.inventoryQuantity <= 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={product.name}
      description={[product.sku, product.brandName].filter(Boolean).join(" · ")}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray sm:size-28">
            <Image
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={
                product.imageUrl.startsWith("data:") ||
                product.imageUrl.startsWith("blob:")
              }
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={product.statusVariant}>{product.statusLabel}</Badge>
              {out ? (
                <Badge variant="warning">Out of stock</Badge>
              ) : low ? (
                <Badge variant="warning">Low stock</Badge>
              ) : null}
            </div>
            {product.shortDescription ? (
              <p className="line-clamp-3 text-sm text-medium-gray">
                {product.shortDescription}
              </p>
            ) : (
              <p className="text-sm text-medium-gray">
                Catalog snapshot — use Edit to change listing details.
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-sm border border-border-gray bg-light-gray/40 p-3 sm:grid-cols-3">
          <Detail label="Price">{formatCurrency(product.price)}</Detail>
          <Detail label="On hand">
            <span
              className={cn(
                "tabular-nums font-semibold",
                out && "text-red-700",
                low && "text-warning-orange",
              )}
            >
              {product.inventoryQuantity.toLocaleString()}
            </span>
          </Detail>
          <Detail label="Threshold">
            <span className="tabular-nums">{product.lowStockThreshold}</span>
          </Detail>
          <Detail label="Category">{product.categoryName ?? "—"}</Detail>
          <Detail label="Brand">{product.brandName ?? "—"}</Detail>
          <Detail label="SKU">
            <span className="font-mono text-xs">{product.sku}</span>
          </Detail>
          {product.stockSizes && product.stockSizes.length > 0 ? (
            <Detail label="By size" className="col-span-2 sm:col-span-3">
              <ul className="flex flex-wrap gap-1.5">
                {product.stockSizes.map((row) => (
                  <li
                    key={row.size}
                    className="rounded-sm border border-border-gray bg-white px-2 py-0.5 text-xs tabular-nums"
                  >
                    <span className="font-medium">{row.size}</span>
                    <span className="text-medium-gray"> · {row.qty}</span>
                  </li>
                ))}
              </ul>
            </Detail>
          ) : product.stockBySize ? (
            <Detail label="By size" className="col-span-2 sm:col-span-3">
              <span className="text-xs tabular-nums text-medium-gray">
                {product.stockBySize}
              </span>
            </Detail>
          ) : null}
        </dl>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-gray pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {product.showReplenish !== false ? (
            <ReplenishProductButton
              productId={product.id}
              productName={product.name}
              currentQty={product.inventoryQuantity}
            />
          ) : null}
          <Link
            href={product.editHref}
            className="inline-flex h-8 items-center rounded-sm bg-titan-yellow px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
          >
            Edit product
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
