import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: `Thank you for your order from ${SITE_CONFIG.name}.`,
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : null;
  const orderRef = sessionId
    ? sessionId.startsWith("demo_")
      ? sessionId.replace(/^demo_/, "DEMO-")
      : sessionId.slice(0, 18).toUpperCase()
    : null;

  return (
    <div className="container-titan py-8 lg:py-12">
      <ClearCartOnSuccess />
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: "/" },
          { label: "Checkout" },
          { label: "Success" },
        ]}
      />

      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-sm bg-titan-yellow/20 text-dark-charcoal">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
          Thank you for your order
        </h1>
        <p className="mt-3 text-medium-gray">
          Your payment was received. A confirmation email will arrive shortly
          from {SITE_CONFIG.supportEmail}.
        </p>
        {orderRef ? (
          <p className="mt-6 rounded-sm border border-border-gray bg-light-gray px-4 py-3 text-sm text-dark-charcoal">
            Order reference:{" "}
            <span className="font-semibold tracking-wide">{orderRef}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            Continue shopping
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
