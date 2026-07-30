import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `Terms of service for ${SITE_CONFIG.name}.`,
};

export default function TermsPage() {
  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Terms of service
      </h1>
      <p className="mt-4 text-sm text-medium-gray">Last updated: July 30, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-medium-gray">
        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Agreement
          </h2>
          <p className="mt-3">
            By accessing {SITE_CONFIG.name} websites and placing orders, you agree to these
            terms. If you are buying on behalf of a company, you represent that you have
            authority to bind that company.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Products & pricing
          </h2>
          <p className="mt-3">
            We strive for accurate descriptions and pricing. We may correct errors, update
            availability, and refuse or cancel orders when necessary. Quotes are valid for
            the period stated on the quote document.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Accounts
          </h2>
          <p className="mt-3">
            You are responsible for maintaining the confidentiality of your account
            credentials and for activity under your account.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Limitation of liability
          </h2>
          <p className="mt-3">
            To the fullest extent permitted by law, {SITE_CONFIG.name} is not liable for
            indirect, incidental, or consequential damages arising from use of our products
            or site. PPE must be selected and used according to applicable standards and
            manufacturer instructions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            Related policies
          </h2>
          <p className="mt-3">
            See also our{" "}
            <Link href="/privacy" className="text-dark-charcoal underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/shipping" className="text-dark-charcoal underline-offset-2 hover:underline">
              Shipping
            </Link>
            , and{" "}
            <Link href="/returns" className="text-dark-charcoal underline-offset-2 hover:underline">
              Returns
            </Link>{" "}
            pages.
          </p>
        </section>
      </div>
    </div>
  );
}
