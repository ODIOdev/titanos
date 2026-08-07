import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock3,
  FileSpreadsheet,
  Headphones,
  Mail,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import { QuoteForm } from "@/components/quotes/quote-form";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request a quote",
  description: `Request volume pricing and custom quotes from ${SITE_CONFIG.name}.`,
};

const EXPECTATIONS = [
  {
    icon: Clock3,
    title: "1 business day",
    body: "Typical response with pricing and lead times.",
  },
  {
    icon: Package,
    title: "Volume pricing",
    body: "Crew, municipal, and multi-SKU jobsite buys.",
  },
  {
    icon: Truck,
    title: "Freight options",
    body: "We include shipping paths with your quote.",
  },
] as const;

export default function QuotePage() {
  return (
    <div className="container-titan py-10 @5xl:py-14">
      <header className="border-b border-border-gray pb-8">
        <div className="max-w-3xl border-l-4 border-titan-yellow pl-5">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-medium-gray">
            Volume &amp; custom pricing
          </p>
          <h1 className="mt-2 font-heading text-4xl uppercase leading-[1.05] tracking-wide text-dark-charcoal @3xl:text-5xl">
            Request a quote
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-medium-gray">
            Tell us what your crew needs — catalog SKUs, custom gear, or a full
            jobsite list. We reply with pricing, lead times, and freight
            options.
          </p>
        </div>
      </header>

      <ul className="mt-6 grid gap-2 @3xl:grid-cols-3">
        {EXPECTATIONS.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 border border-border-gray bg-white px-3 py-2.5"
          >
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border border-border-gray bg-light-gray/60 text-dark-charcoal">
              <item.icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-xs uppercase tracking-wide text-dark-charcoal">
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-medium-gray">
                {item.body}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 @5xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @5xl:gap-12">
        <aside className="space-y-8 @5xl:sticky @5xl:top-24 @5xl:self-start">
          <section aria-labelledby="quote-help-heading">
            <h2
              id="quote-help-heading"
              className="font-heading text-sm uppercase tracking-wide text-dark-charcoal"
            >
              Before you submit
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-medium-gray">
              <li className="flex gap-2">
                <FileSpreadsheet
                  className="mt-0.5 size-4 shrink-0 text-dark-charcoal"
                  aria-hidden="true"
                />
                <span>
                  Search the catalog for SKUs, or type custom / non-catalog
                  items.
                </span>
              </li>
              <li className="flex gap-2">
                <Package
                  className="mt-0.5 size-4 shrink-0 text-dark-charcoal"
                  aria-hidden="true"
                />
                <span>
                  Add quantities per line. Attach a BOM or spreadsheet if you
                  have one.
                </span>
              </li>
              <li className="flex gap-2">
                <Truck
                  className="mt-0.5 size-4 shrink-0 text-dark-charcoal"
                  aria-hidden="true"
                />
                <span>
                  Job site address helps us estimate freight accurately.
                </span>
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="quote-contact-heading"
            className="border-t border-border-gray pt-6"
          >
            <h2
              id="quote-contact-heading"
              className="font-heading text-sm uppercase tracking-wide text-dark-charcoal"
            >
              Prefer to talk?
            </h2>
            <div className="mt-3 space-y-2">
              <a
                href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-2.5 text-sm text-dark-charcoal transition-colors hover:text-near-black"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium underline-offset-2 hover:underline">
                  {SITE_CONFIG.phoneDisplay}
                </span>
              </a>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="flex items-center gap-2.5 text-sm text-dark-charcoal transition-colors hover:text-near-black"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium underline-offset-2 hover:underline">
                  {SITE_CONFIG.email}
                </span>
              </a>
            </div>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 w-full justify-center @5xl:w-auto",
              )}
            >
              <Headphones className="size-3.5" aria-hidden="true" />
              Contact support
            </Link>
          </section>
        </aside>

        <div className="min-w-0 border border-border-gray bg-white p-5 @3xl:p-8">
          <QuoteForm />
        </div>
      </div>
    </div>
  );
}
