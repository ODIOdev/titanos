import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: `Checkout was cancelled at ${SITE_CONFIG.name}.`,
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="container-titan py-8 lg:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: "/" },
          { label: "Checkout" },
          { label: "Cancelled" },
        ]}
      />

      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-sm bg-light-gray text-medium-gray">
          <XCircle className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
          Checkout cancelled
        </h1>
        <p className="mt-3 text-medium-gray">
          No charge was made. Your cart is still saved — return anytime to
          complete your order.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/cart"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            Return to cart
          </Link>
          <Link
            href="/shop"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
