import type { Metadata } from "next";
import { QuoteForm } from "@/components/quotes/quote-form";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Request a quote",
  description: `Request volume pricing and custom quotes from ${SITE_CONFIG.name}.`,
};

export default function QuotePage() {
  return (
    <div className="bg-light-gray">
      <div className="container-titan py-10 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-titan-yellow uppercase">
            Volume & custom pricing
          </p>
          <h1 className="mt-2 font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
            Request a quote
          </h1>
          <p className="mt-4 text-base text-medium-gray">
            Tell us what your crew needs. We typically respond within one business
            day with pricing, lead times, and freight options.
          </p>

          <div className="mt-10 rounded-sm border border-border-gray bg-white p-6 sm:p-8">
            <QuoteForm />
          </div>
        </div>
      </div>
    </div>
  );
}
