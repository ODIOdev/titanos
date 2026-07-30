import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `Privacy policy for ${SITE_CONFIG.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-medium-gray">Last updated: July 30, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-medium-gray">
        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Overview
          </h2>
          <p className="mt-3">
            {SITE_CONFIG.name} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This
            policy explains what information we collect when you shop, create an account,
            request a quote, or contact us, and how we use it.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Information we collect
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Account details such as name, email, company, and phone number</li>
            <li>Order and shipping information needed to fulfill purchases</li>
            <li>Quote request details and uploaded attachments</li>
            <li>Device and usage data such as browser type and pages visited</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            How we use information
          </h2>
          <p className="mt-3">
            We use your information to process orders, respond to quotes and support
            requests, improve our site, prevent fraud, and — with your consent — send
            product updates and promotional emails. You can unsubscribe at any time.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Sharing
          </h2>
          <p className="mt-3">
            We share data with service providers who help us operate (payment processing,
            shipping carriers, hosting, and email). We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Contact
          </h2>
          <p className="mt-3">
            Privacy questions:{" "}
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="text-dark-charcoal underline-offset-2 hover:underline"
            >
              {SITE_CONFIG.supportEmail}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
