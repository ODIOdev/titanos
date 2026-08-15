import type { Metadata } from "next";
import Link from "next/link";
import { getFreeShippingThreshold } from "@/lib/data/free-shipping";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping",
  description: `Shipping policy and freight information for ${SITE_CONFIG.name}.`,
};

export default async function ShippingPage() {
  const freeShippingThreshold = await getFreeShippingThreshold();

  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Shipping
      </h1>
      <p className="mt-4 text-medium-gray">
        How we get gear from our warehouse to your jobsite.
      </p>

      <div className="prose-titan mt-10 space-y-8 text-sm leading-relaxed text-medium-gray">
        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Free shipping
          </h2>
          <p className="mt-3">
            Orders totaling {formatCurrency(freeShippingThreshold)} or more before tax
            typically qualify for free small-parcel shipping within the contiguous United
            States. Promotional exclusions and oversized items may apply.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Processing times
          </h2>
          <p className="mt-3">
            In-stock items usually leave our facility within 1–2 business days. You will
            receive tracking when the carrier scans the shipment.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Freight & oversized
          </h2>
          <p className="mt-3">
            Barricades, pallet quantities, and other freight shipments are quoted
            separately. Include your ship-to ZIP on a{" "}
            <Link href="/quote" className="text-dark-charcoal underline-offset-2 hover:underline">
              quote request
            </Link>{" "}
            for accurate rates and transit estimates.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Damaged shipments
          </h2>
          <p className="mt-3">
            Inspect deliveries on arrival. Report visible damage to the carrier and email{" "}
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="text-dark-charcoal underline-offset-2 hover:underline"
            >
              {SITE_CONFIG.supportEmail}
            </a>{" "}
            with photos within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
