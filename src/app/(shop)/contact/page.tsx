import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_CONFIG.name} for sales, quotes, and order support.`,
};

export default function ContactPage() {
  return (
    <div className="container-titan py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 text-base text-medium-gray">
            Questions about products, freight, or bulk pricing? Reach our team and
            we&apos;ll get you an answer.
          </p>

          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-dark-charcoal">Phone</dt>
              <dd className="mt-1 text-medium-gray">
                <a href={`tel:${SITE_CONFIG.phone}`} className="hover:text-dark-charcoal">
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-dark-charcoal">Sales</dt>
              <dd className="mt-1 text-medium-gray">
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-dark-charcoal">
                  {SITE_CONFIG.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-dark-charcoal">Support</dt>
              <dd className="mt-1 text-medium-gray">
                <a
                  href={`mailto:${SITE_CONFIG.supportEmail}`}
                  className="hover:text-dark-charcoal"
                >
                  {SITE_CONFIG.supportEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-dark-charcoal">Address</dt>
              <dd className="mt-1 text-medium-gray">
                {SITE_CONFIG.address.line1}
                <br />
                {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
                {SITE_CONFIG.address.postalCode}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-sm border border-border-gray bg-white p-6 sm:p-8">
          <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal">
            Send a message
          </h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
