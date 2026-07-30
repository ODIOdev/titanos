import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Headphones, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bulk orders",
  description: `Volume pricing and crew outfitting from ${SITE_CONFIG.name}.`,
};

const BENEFITS = [
  {
    icon: ClipboardList,
    title: "Volume pricing",
    description: "Tiered discounts for crews, municipalities, and multi-site accounts.",
  },
  {
    icon: Truck,
    title: "Coordinated freight",
    description: "Palletized shipments and jobsite delivery options for large orders.",
  },
  {
    icon: Headphones,
    title: "Dedicated support",
    description: "Work with a sales specialist who understands PPE and traffic control.",
  },
  {
    icon: CheckCircle2,
    title: "Spec compliance",
    description: "Help matching ANSI ratings, colors, and agency requirements.",
  },
];

export default function BulkOrdersPage() {
  return (
    <div>
      <section className="bg-dark-charcoal py-14 lg:py-20">
        <div className="container-titan max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-titan-yellow uppercase">
            Crew & municipal programs
          </p>
          <h1 className="mt-3 font-heading text-4xl uppercase tracking-wide text-white md:text-5xl">
            Bulk orders made simple
          </h1>
          <p className="mt-4 text-lg text-white/75">
            Outfit an entire crew or stock a municipal yard with volume pricing,
            account support, and reliable lead times from {SITE_CONFIG.name}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              Request a quote
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      <section className="container-titan py-14 lg:py-16">
        <h2 className="font-heading text-3xl uppercase tracking-wide text-dark-charcoal">
          Why teams buy in bulk with us
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title}>
                <Icon className="size-8 text-titan-yellow" aria-hidden="true" />
                <h3 className="mt-4 font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-medium-gray">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border-gray bg-light-gray py-14">
        <div className="container-titan max-w-2xl text-center">
          <h2 className="font-heading text-3xl uppercase tracking-wide text-dark-charcoal">
            Ready for a quote?
          </h2>
          <p className="mt-3 text-medium-gray">
            Share your product list, quantities, and ship-to location. We&apos;ll
            return pricing and availability quickly.
          </p>
          <Link
            href="/quote"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-8 inline-flex")}
          >
            Open quote form
          </Link>
        </div>
      </section>
    </div>
  );
}
