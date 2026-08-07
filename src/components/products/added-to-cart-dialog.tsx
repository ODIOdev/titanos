"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { useCart, type CartProductSnapshot } from "@/components/providers/cart-provider";
import { cn, formatCurrency } from "@/lib/utils";

export type AddedToCartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CartProductSnapshot;
  quantity: number;
};

/** Post–add-to-cart confirmation: shows the line just added + cart totals. */
export function AddedToCartDialog({
  open,
  onOpenChange,
  product,
  quantity,
}: AddedToCartDialogProps) {
  const { itemCount, subtotal } = useCart();
  const lineTotal = product.price * quantity;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Added to cart"
      description="Your cart was updated."
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-sm border border-border-gray bg-light-gray/60 p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-white">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt=""
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-medium-gray">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              {product.name}
            </p>
            {product.sku ? (
              <p className="mt-0.5 text-xs text-medium-gray">SKU {product.sku}</p>
            ) : null}
            <p className="mt-1.5 text-sm text-dark-charcoal">
              <span className="font-semibold">{quantity}</span>
              <span className="text-medium-gray"> × </span>
              {formatCurrency(product.price)}
              <span className="text-medium-gray"> = </span>
              <span className="font-semibold">{formatCurrency(lineTotal)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-gray pt-3 text-sm">
          <p className="text-medium-gray">
            Cart · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
          <p className="font-semibold text-dark-charcoal">
            {formatCurrency(subtotal)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "w-full justify-center sm:w-auto sm:min-w-[9rem]",
            )}
            onClick={() => onOpenChange(false)}
          >
            View cart
          </Link>
          <Link
            href="/shop"
            className={cn(
              buttonVariants({ variant: "outline", size: "md" }),
              "w-full justify-center sm:w-auto sm:flex-1",
            )}
            onClick={() => onOpenChange(false)}
            data-autofocus
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
