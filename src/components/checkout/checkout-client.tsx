"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { ArrowDown, Lock, Pencil, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DemoCheckoutForm } from "@/components/checkout/demo-checkout-form";
import { PaymentMethodLogos } from "@/components/shared/payment-method-logos";
import { useCart } from "@/components/providers/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/data/seed-data";
import { getStripeJs } from "@/lib/stripe/client";
import type { CheckoutProfileDefaults } from "@/lib/auth/session";
import {
  cn,
  formatCurrency,
  getFreeShippingRemaining,
} from "@/lib/utils";

const STANDARD_SHIPPING = 12.99;
const TAX_RATE = 0.08;

export function CheckoutClient({
  profileDefaults,
}: {
  profileDefaults?: CheckoutProfileDefaults;
}) {
  const { items, subtotal, itemCount, isHydrated } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping =
    subtotal <= 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const remaining = getFreeShippingRemaining(subtotal, FREE_SHIPPING_THRESHOLD);
  const freeShipProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  function scrollToPayment() {
    document
      .getElementById("checkout-payment")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const cartPayload = useMemo(
    () =>
      items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        variantId: item.variant_id ?? null,
      })),
    [items],
  );

  const startCheckout = useCallback(async () => {
    if (cartPayload.length === 0) return;
    setLoading(true);
    setStarted(true);
    setError(null);
    setDemoMode(false);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartPayload,
          uiMode: "embedded",
          email: profileDefaults?.email || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        clientSecret?: string;
        url?: string;
        demo?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.error ?? data?.message ?? "Unable to start checkout.",
        );
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        return;
      }

      if (data?.demo) {
        setDemoMode(true);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Checkout did not return a payment session.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Checkout failed. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [cartPayload, profileDefaults?.email]);

  useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0) return;
    if (started || clientSecret || demoMode || loading) return;
    void startCheckout();
  }, [
    isHydrated,
    items.length,
    started,
    clientSecret,
    demoMode,
    loading,
    startCheckout,
  ]);

  if (!isHydrated) {
    return (
      <div className="container-titan py-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-36 animate-pulse rounded-sm bg-light-gray" />
          <div className="mt-8 h-96 animate-pulse rounded-sm bg-light-gray" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-titan py-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Home", href: "/" },
              { label: "Cart", href: "/cart" },
              { label: "Checkout" },
            ]}
          />
          <EmptyState
            icon={<ShoppingBag />}
            title="Nothing to check out"
            description="Add gear to your cart, then come back to enter shipping and payment."
            action={
              <Link
                href="/shop"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                Continue shopping
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[linear-gradient(180deg,#faf6ee_0%,#f5f6f7_48%)]">
      <div className="container-titan py-5 lg:py-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            className="mb-3"
            items={[
              { label: "Home", href: "/" },
              { label: "Cart", href: "/cart" },
              { label: "Checkout" },
            ]}
          />

          <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal md:text-2xl">
              Checkout
            </h1>
            <p className="inline-flex items-center gap-1 rounded-sm bg-titan-yellow/25 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-dark-charcoal">
              <Lock className="size-2.5" aria-hidden="true" />
              Encrypted
            </p>
          </header>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start">
            <div
              id="checkout-payment"
              className="min-w-0 scroll-mt-24 overflow-hidden rounded-sm border border-[#eadfce] bg-[#fffdf9] shadow-[0_1px_0_rgba(90,70,40,0.06)]"
            >
              <div className="border-b border-[#eadfce] bg-titan-yellow/15 px-3 py-2 sm:px-4">
                <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                  Shipping &amp; payment
                </h2>
                <p className="text-[0.65rem] text-[#8a7d66]">
                  {demoMode
                    ? "Quick steps to place your order."
                    : "Address and payment via Stripe."}
                </p>
              </div>

              <div className="p-3 sm:p-4">
                {error ? (
                  <div className="mb-3 space-y-2 rounded-sm border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800">
                    <p>{error}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setClientSecret(null);
                        setDemoMode(false);
                        setStarted(false);
                        void startCheckout();
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                ) : null}

                {loading && !clientSecret && !demoMode ? (
                  <div className="space-y-2">
                    <div className="h-8 animate-pulse rounded-sm bg-[#f0e9dc]" />
                    <div className="h-20 animate-pulse rounded-sm bg-[#f0e9dc]" />
                    <div className="h-24 animate-pulse rounded-sm bg-[#f0e9dc]" />
                  </div>
                ) : null}

                {demoMode ? (
                  <DemoCheckoutForm
                    items={cartPayload}
                    total={total}
                    defaults={profileDefaults}
                  />
                ) : null}

                {clientSecret ? (
                  <div className="overflow-hidden rounded-sm border border-[#eadfce]">
                    <EmbeddedCheckoutProvider
                      stripe={getStripeJs()}
                      options={{ clientSecret }}
                    >
                      <EmbeddedCheckout className="min-h-[24rem]" />
                    </EmbeddedCheckoutProvider>
                  </div>
                ) : null}

                {!demoMode && clientSecret ? (
                  <div className="mt-3 border-t border-[#eadfce] pt-3">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[#8a7d66]">
                      We accept
                    </p>
                    <PaymentMethodLogos className="mt-1.5" />
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="h-fit overflow-hidden rounded-sm border border-[#eadfce] bg-[#fffdf9] shadow-[0_1px_0_rgba(90,70,40,0.06)] lg:sticky lg:top-24">
              <div className="border-b border-[#eadfce] bg-[#2c2822] px-3.5 py-2.5">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-titan-yellow">
                      Order summary
                    </h2>
                    <p className="mt-0.5 text-[0.65rem] text-white/55">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-white">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              <ul className="max-h-44 divide-y divide-[#eadfce] overflow-y-auto">
                {items.map((item) => {
                  const product = item.product;
                  const image =
                    product?.image_url ??
                    "/images/products/titan-premium-vented-hard-hat.svg";
                  return (
                    <li key={item.id} className="flex gap-2.5 px-3.5 py-2.5">
                      <Link
                        href={product ? `/product/${product.slug}` : "/shop"}
                        className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-[#eadfce] bg-white"
                      >
                        <Image
                          src={image}
                          alt=""
                          fill
                          className="object-contain p-0.5"
                          sizes="40px"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={product ? `/product/${product.slug}` : "/shop"}
                          className="line-clamp-2 text-[0.7rem] font-medium leading-snug text-dark-charcoal hover:underline"
                        >
                          {product?.name ?? "Product"}
                        </Link>
                        <p className="mt-0.5 text-[0.6rem] text-[#8a7d66]">
                          Qty {item.quantity} ·{" "}
                          {formatCurrency(product?.price ?? 0)} ea
                        </p>
                      </div>
                      <p className="shrink-0 text-[0.7rem] font-semibold tabular-nums text-dark-charcoal">
                        {formatCurrency((product?.price ?? 0) * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-1.5 border-t border-[#eadfce] bg-[#faf6ee] px-3.5 py-3">
                <div className="flex justify-between gap-2 text-[0.7rem]">
                  <span className="text-[#8a7d66]">Subtotal</span>
                  <span className="tabular-nums text-dark-charcoal">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 text-[0.7rem]">
                  <span className="text-[#8a7d66]">Shipping</span>
                  <span className="tabular-nums text-dark-charcoal">
                    {shipping === 0 ? (
                      <span className="font-medium text-emerald-800">Free</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-2 text-[0.7rem]">
                  <span className="text-[#8a7d66]">Est. tax</span>
                  <span className="tabular-nums text-dark-charcoal">
                    {formatCurrency(tax)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t border-[#eadfce] pt-2">
                  <span className="font-heading text-[0.7rem] font-semibold uppercase tracking-wide text-dark-charcoal">
                    Total due
                  </span>
                  <span className="text-base font-bold tabular-nums text-dark-charcoal">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-[#eadfce] px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2 text-[0.6rem] font-medium text-dark-charcoal">
                  <span>Free shipping</span>
                  <span className="tabular-nums text-[#8a7d66]">
                    {remaining > 0
                      ? `${formatCurrency(remaining)} to go`
                      : "Unlocked"}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[#eadfce]"
                  role="progressbar"
                  aria-valuenow={Math.round(freeShipProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress toward free shipping"
                >
                  <div
                    className="h-full rounded-full bg-titan-yellow transition-all"
                    style={{ width: `${freeShipProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[#eadfce] px-3.5 py-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="h-9 w-full gap-1.5 text-xs"
                  onClick={scrollToPayment}
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                  {demoMode ? `Pay ${formatCurrency(total)}` : "Complete payment"}
                </Button>
                <Link
                  href="/cart"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 w-full gap-1.5 text-xs",
                  )}
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  Edit cart
                </Link>
                <Link
                  href="/shop"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-8 w-full gap-1.5 text-xs text-[#8a7d66] hover:text-dark-charcoal",
                  )}
                >
                  <ShoppingBag className="size-3" aria-hidden="true" />
                  Continue shopping
                </Link>
              </div>

              <p className="flex items-center justify-center gap-1 border-t border-[#eadfce] bg-[#faf6ee] px-3 py-2 text-[0.6rem] text-[#8a7d66]">
                <Lock className="size-2.5" aria-hidden="true" />
                Secure checkout · Titan Safety Co.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
