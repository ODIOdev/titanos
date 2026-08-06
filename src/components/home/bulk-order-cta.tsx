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
        "relative overflow-hidden bg-dark-charcoal py-9 @3xl:py-14 @5xl:py-16",
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
            className="mt-2 font-heading text-2xl uppercase tracking-wide text-white @3xl:text-4xl @5xl:text-5xl"
          >
            Outfitting a full crew?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 @3xl:mt-4 @3xl:text-base @5xl:text-lg">
            Get volume pricing, account support, and custom ordering options for
            your company or municipality.
          </p>
          <div className="mt-5 flex flex-row gap-2 @3xl:mt-8 @3xl:gap-3">
            <Link
              href="/bulk-orders"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "min-w-0 flex-1 justify-center px-2.5 text-center text-xs leading-tight @3xl:flex-none @3xl:px-6 @3xl:text-base @3xl:leading-normal",
              )}
            >
              <span className="@3xl:hidden">Bulk Pricing</span>
              <span className="hidden @3xl:inline">Request Bulk Pricing</span>
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outlineInverse", size: "lg" }),
                "min-w-0 flex-1 justify-center px-2.5 text-center text-xs leading-tight @3xl:flex-none @3xl:px-6 @3xl:text-base @3xl:leading-normal",
              )}
            >
              <span className="@3xl:hidden">Contact</span>
              <span className="hidden @3xl:inline">Contact Sales</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
