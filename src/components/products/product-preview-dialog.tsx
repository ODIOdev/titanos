"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

export type StorefrontProductPreview = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string;
  brandName: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
  lowStockThreshold: number;
  shortDescription?: string | null;
};

type ProductPreviewDialogProps = {
  product: StorefrontProductPreview | null;
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

/** Storefront quick-view dialog — same overlay pattern as admin product preview. */
export function ProductPreviewDialog({
  product,
  open,
  onOpenChange,
}: ProductPreviewDialogProps) {
  if (!product) return null;

  const low =
    product.inventoryQuantity > 0 &&
    product.inventoryQuantity <= product.lowStockThreshold;
  const out = product.inventoryQuantity <= 0;
  const href = `/product/${product.slug}`;

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
              {out ? (
                <Badge variant="warning">Out of stock</Badge>
              ) : low ? (
                <Badge variant="warning">Low stock</Badge>
              ) : (
                <Badge variant="success">In stock</Badge>
              )}
            </div>
            {product.shortDescription ? (
              <p className="line-clamp-3 text-sm text-medium-gray">
                {product.shortDescription}
              </p>
            ) : (
              <p className="text-sm text-medium-gray">
                Quick look — open the product page for full details and options.
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-sm border border-border-gray bg-light-gray/40 p-3 sm:grid-cols-3">
          <Detail label="Price">
            <span className="font-semibold tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice != null &&
            product.compareAtPrice > product.price ? (
              <span className="ml-1.5 text-xs text-medium-gray line-through tabular-nums">
                {formatCurrency(product.compareAtPrice)}
              </span>
            ) : null}
          </Detail>
          <Detail label="Availability">
            <span
              className={cn(
                "font-semibold",
                out && "text-red-700",
                low && "text-warning-orange",
              )}
            >
              {out
                ? "Out of stock"
                : low
                  ? "Low stock"
                  : "In stock"}
            </span>
          </Detail>
          <Detail label="On hand">
            <span className="tabular-nums">
              {product.inventoryQuantity.toLocaleString()}
            </span>
          </Detail>
          <Detail label="Category">{product.categoryName ?? "—"}</Detail>
          <Detail label="Brand">{product.brandName ?? "—"}</Detail>
          <Detail label="SKU">
            <span className="font-mono text-xs">{product.sku}</span>
          </Detail>
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
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              price: product.price,
              compare_at_price: product.compareAtPrice,
              inventory_quantity: product.inventoryQuantity,
              image_url: product.imageUrl,
            }}
            size="sm"
            variant="secondary"
            label="Add to Cart"
            disabled={out}
          />
          <Link
            href={href}
            className="inline-flex h-8 items-center rounded-sm bg-titan-yellow px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
            onClick={() => onOpenChange(false)}
          >
            View product
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
