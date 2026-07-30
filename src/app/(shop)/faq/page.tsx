import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ordering from ${SITE_CONFIG.name}.`,
};

const FAQS = [
  {
    q: "Do you offer volume discounts?",
    a: "Yes. Request a quote for crew-sized and municipal orders. Pricing depends on product mix, quantity, and ship-to location.",
  },
  {
    q: "What is your free shipping threshold?",
    a: "Qualified orders over $199 typically ship free within the contiguous U.S. Oversized freight items may have separate rates.",
  },
  {
    q: "Can I order tax-exempt?",
    a: "Tax-exempt organizations can note tax-exempt status on quote requests and provide exemption documentation to our sales team.",
  },
  {
    q: "How long does shipping take?",
    a: "Most in-stock small-parcel items ship within 1–2 business days. Freight and special-order items include lead times on the quote or product page.",
  },
  {
    q: "Do products meet ANSI standards?",
    a: "Where applicable, product pages list ANSI ratings and certifications. Contact us if you need help matching a jobsite specification.",
  },
  {
    q: "How do returns work?",
    a: "Unopened, unused items in original packaging may be returned within 30 days. See our Returns policy for details and exclusions.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        FAQ
      </h1>
      <p className="mt-4 text-medium-gray">
        Quick answers about ordering, shipping, and compliance. Still stuck?{" "}
        <Link href="/contact" className="text-dark-charcoal underline-offset-2 hover:underline">
          Contact us
        </Link>
        .
      </p>

      <div className="mt-10 space-y-4">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-sm border border-border-gray bg-white open:shadow-sm"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-heading text-lg uppercase tracking-wide text-dark-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="text-medium-gray transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="border-t border-border-gray px-5 py-4 text-sm leading-relaxed text-medium-gray">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
