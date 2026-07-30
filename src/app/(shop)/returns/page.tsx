import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Returns",
  description: `Returns and exchanges policy for ${SITE_CONFIG.name}.`,
};

export default function ReturnsPage() {
  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Returns
      </h1>
      <p className="mt-4 text-medium-gray">
        Straightforward returns for unused products in sellable condition.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-medium-gray">
        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            30-day window
          </h2>
          <p className="mt-3">
            Most unused items in original packaging may be returned within 30 days of
            delivery for a refund to the original payment method, minus any original
            shipping charges unless the return is due to our error.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            How to start a return
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Email{" "}
              <a
                href={`mailto:${SITE_CONFIG.supportEmail}`}
                className="text-dark-charcoal underline-offset-2 hover:underline"
              >
                {SITE_CONFIG.supportEmail}
              </a>{" "}
              with your order number and reason for return.
            </li>
            <li>We&apos;ll confirm eligibility and provide return instructions.</li>
            <li>Ship items securely; include all original packaging when possible.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Non-returnable items
          </h2>
          <p className="mt-3">
            Custom-printed signs, special-order products, used or worn PPE, and opened
            hygiene-sensitive items generally cannot be returned. Contact us if you
            received a defective product.
          </p>
        </section>

        <p>
          Questions? Visit our{" "}
          <Link href="/contact" className="text-dark-charcoal underline-offset-2 hover:underline">
            contact page
          </Link>{" "}
          or see the{" "}
          <Link href="/faq" className="text-dark-charcoal underline-offset-2 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
