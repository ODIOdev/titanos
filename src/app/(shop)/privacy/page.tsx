import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/layout/cookie-consent-banner";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `Privacy policy for ${SITE_CONFIG.name}, including cookies, analytics, and how we use your information.`,
};

const headingClass =
  "scroll-mt-24 font-heading text-2xl uppercase tracking-wide text-dark-charcoal";

export default function PrivacyPage() {
  return (
    <div className="container-titan max-w-3xl py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-medium-gray">Last updated: August 16, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-medium-gray">
        <section>
          <h2 className={headingClass}>Overview</h2>
          <p className="mt-3">
            {SITE_CONFIG.name} (&quot;we&quot;, &quot;us&quot;), {SITE_CONFIG.address.city},{" "}
            {SITE_CONFIG.address.state}, respects your privacy. This policy explains what
            information we collect when you browse, shop, create an account, request a
            quote, or contact us — and how cookies and analytics work on this site.
          </p>
        </section>

        <section>
          <h2 className={headingClass}>Information we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Account details such as name, email, company, and phone number</li>
            <li>Order, billing, and shipping information needed to fulfill purchases</li>
            <li>Quote request details and uploaded attachments</li>
            <li>Messages you send through support chat, contact forms, or email</li>
            <li>
              Device and usage data such as browser type, pages viewed, and approximate
              location derived from IP address
            </li>
            <li>
              Cookie and similar storage data described in{" "}
              <a href="#cookies" className="text-dark-charcoal underline-offset-2 hover:underline">
                Cookies
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className={headingClass}>How we use information</h2>
          <p className="mt-3">
            We use your information to process orders, respond to quotes and support
            requests, keep your cart and account working, prevent fraud, and operate the
            website. With your consent, we also measure site traffic and may send product
            updates or promotional emails. You can unsubscribe from marketing email at
            any time.
          </p>
        </section>

        <section id="cookies">
          <h2 className={headingClass}>Cookies</h2>
          <p className="mt-3">
            When you first visit, a prompt at the bottom of the site asks you to Accept
            or Decline optional cookies. Necessary cookies stay on either way so the
            store can function. You can change your choice later from this page or the
            Cookies link in the footer. We store that choice for one year in a first-party
            cookie named <span className="text-dark-charcoal">titan_cookie_consent</span>.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-dark-charcoal">Necessary</span> — required to run
              the site: sign-in session (Supabase), security, your cookie preference,
              and on-device cart, wishlist, and recent-search storage. These are not
              optional.
            </li>
            <li>
              <span className="text-dark-charcoal">Analytics</span> — Vercel Web
              Analytics, loaded only after you tap Accept. It measures visits and page
              views so we can improve the storefront. Decline (or not choosing yet)
              keeps the store working without this tracking.
            </li>
          </ul>
          <p className="mt-3">
            We do not use advertising or social-media tracking pixels on this site.
            Accepting cookies does not mean we sell your personal information.
          </p>
          <p className="mt-3">
            <CookieSettingsButton className="text-dark-charcoal underline underline-offset-2 hover:text-dark-charcoal/80">
              Change cookie preferences
            </CookieSettingsButton>{" "}
            to reopen the Accept / Decline prompt.
          </p>
        </section>

        <section>
          <h2 className={headingClass}>Sharing</h2>
          <p className="mt-3">
            We share data with service providers who help us operate the store. They
            may only use it to provide those services:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Hosting and analytics: Vercel</li>
            <li>Accounts and database: Supabase</li>
            <li>Payments: Stripe</li>
            <li>Shipping and labels: our fulfillment carriers</li>
            <li>Optional sign-in: Google or Apple, if you choose those buttons</li>
            <li>Support chat replies: OpenAI, when that widget is enabled</li>
          </ul>
          <p className="mt-3">We do not sell personal information.</p>
        </section>

        <section>
          <h2 className={headingClass}>Your choices</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Accept or decline analytics cookies from the site prompt</li>
            <li>Update or close your account by contacting us</li>
            <li>Unsubscribe from marketing email using the link in those messages</li>
          </ul>
        </section>

        <section>
          <h2 className={headingClass}>Contact</h2>
          <p className="mt-3">
            Privacy questions:{" "}
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="text-dark-charcoal underline-offset-2 hover:underline"
            >
              {SITE_CONFIG.supportEmail}
            </a>
          </p>
          <p className="mt-3">
            See also our{" "}
            <Link href="/terms" className="text-dark-charcoal underline-offset-2 hover:underline">
              Terms of service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
