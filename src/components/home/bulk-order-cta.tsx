import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BulkOrderCtaProps = {
  className?: string;
};

export function BulkOrderCta({ className }: BulkOrderCtaProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-dark-charcoal py-14 sm:py-16",
        className,
      )}
      aria-labelledby="bulk-order-heading"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-titan-yellow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(245,196,0,0.05)_100%)]"
        aria-hidden="true"
      />

      <div className="container-titan relative">
        <div className="max-w-3xl">
          <p className="eyebrow-accent">Volume programs</p>
          <h2
            id="bulk-order-heading"
            className="mt-2 font-heading text-3xl uppercase tracking-wide text-white sm:text-4xl lg:text-5xl"
          >
            Outfitting a full crew?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Get volume pricing, account support, and custom ordering options for
            your company or municipality.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/bulk-orders"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Request Bulk Pricing
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outlineInverse", size: "lg" }),
              )}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
