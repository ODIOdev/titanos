"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QuantitySelector } from "@/components/products/quantity-selector";
import { PaymentMethodLogos } from "@/components/shared/payment-method-logos";
import { useCart } from "@/components/providers/cart-provider";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cn,
  formatCurrency,
  getFreeShippingRemaining,
} from "@/lib/utils";

const STANDARD_SHIPPING = 12.99;
const TAX_RATE = 0.08;

export function CartPageClient({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number;
}) {
  const router = useRouter();
  const {
    items,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    isHydrated,
    itemCount,
  } = useCart();

  const shipping =
    subtotal <= 0
      ? 0
      : subtotal >= freeShippingThreshold
        ? 0
        : STANDARD_SHIPPING;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const remaining = getFreeShippingRemaining(subtotal, freeShippingThreshold);
  const progress = useMemo(
    () => Math.min(100, (subtotal / freeShippingThreshold) * 100),
    [subtotal, freeShippingThreshold],
  );

  if (!isHydrated) {
    return (
      <div className="container-titan py-8 lg:py-12">
        <div className="h-10 w-40 animate-pulse rounded-sm bg-light-gray" />
        <div className="mt-8 h-64 animate-pulse rounded-sm bg-light-gray" />
      </div>
    );
  }

  return (
    <div className="container-titan py-8 lg:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
      />

      <h1 className="mb-8 font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Add safety gear for your crew and check out when you’re ready."
          action={
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "primary" }))}
            >
              Continue shopping
            </Link>
          }
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-medium-gray">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  toast.message("Cart cleared.");
                }}
                className="text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
              >
                Clear cart
              </button>
            </div>

            <ul className="divide-y divide-border-gray rounded-sm border border-border-gray bg-white">
              {items.map((item) => {
                const product = item.product;
                const image =
                  product?.image_url ??
                  "/images/products/titan-premium-vented-hard-hat.svg";
                const lineTotal = (product?.price ?? 0) * item.quantity;

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <Link
                      href={product ? `/product/${product.slug}` : "/shop"}
                      className="relative size-24 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-white"
                    >
                      <span className="absolute inset-2">
                        <Image
                          src={image}
                          alt={product?.name ?? "Product"}
                          fill
                          className="object-contain"
                          sizes="96px"
                        />
                      </span>
                    </Link>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <Link
                          href={product ? `/product/${product.slug}` : "/shop"}
                          className="font-heading text-base uppercase tracking-wide text-dark-charcoal hover:underline"
                        >
                          {product?.name ?? "Product"}
                        </Link>
                        {product?.sku ? (
                          <p className="text-xs text-medium-gray">
                            SKU: {product.sku}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-dark-charcoal">
                        {formatCurrency(product?.price ?? 0)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <QuantitySelector
                          value={item.quantity}
                          max={product?.inventory_quantity ?? 99}
                          onChange={(qty) => updateQuantity(item.id, qty)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.id);
                            toast.message("Item removed from cart.");
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-medium-gray hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <p className="text-right text-base font-bold text-dark-charcoal sm:min-w-[5.5rem]">
                      {formatCurrency(lineTotal)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <aside className="h-fit space-y-5 rounded-sm border border-border-gray bg-white p-5 lg:sticky lg:top-24">
            <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
              Order Summary
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-medium-gray">Subtotal</span>
                <span className="font-medium text-dark-charcoal">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-medium-gray">Shipping estimate</span>
                <span className="font-medium text-dark-charcoal">
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-medium-gray">Estimated tax (8%)</span>
                <span className="font-medium text-dark-charcoal">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border-gray pt-3 text-base">
                <span className="font-heading uppercase tracking-wide text-dark-charcoal">
                  Total
                </span>
                <span className="font-bold text-dark-charcoal">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-sm bg-light-gray p-3">
              <div className="flex justify-between gap-2 text-xs font-medium text-dark-charcoal">
                <span>Free shipping</span>
                <span>
                  {remaining > 0
                    ? `${formatCurrency(remaining)} away`
                    : "Unlocked"}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-border-gray"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress toward free shipping"
              >
                <div
                  className="h-full rounded-full bg-titan-yellow transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-medium-gray">
                Free standard shipping on orders over{" "}
                {formatCurrency(freeShippingThreshold)}.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/checkout")}
            >
              Checkout
            </Button>

            <div>
              <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                We accept
              </p>
              <PaymentMethodLogos className="justify-center" />
            </div>

            <Link
              href="/shop"
              className="block text-center text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
