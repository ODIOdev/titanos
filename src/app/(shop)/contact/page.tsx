import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Clock3,
  FileText,
  Headphones,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
} from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_CONFIG.name} for sales, quotes, freight, and order support.`,
};

const CHANNELS = [
  {
    icon: Phone,
    label: "Phone",
    value: SITE_CONFIG.phoneDisplay,
    href: `tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`,
    hint: "Sales & order support",
  },
  {
    icon: Mail,
    label: "Sales",
    value: SITE_CONFIG.email,
    href: `mailto:${SITE_CONFIG.email}`,
    hint: "Quotes, bulk pricing, freight",
  },
  {
    icon: Headphones,
    label: "Support",
    value: SITE_CONFIG.supportEmail,
    href: `mailto:${SITE_CONFIG.supportEmail}`,
    hint: "Orders, tracking, returns",
  },
] as const;

const QUICK_LINKS = [
  {
    href: "/quote",
    label: "Request a quote",
    body: "Crew and municipal pricing with lead times.",
    icon: FileText,
  },
  {
    href: "/bulk-orders",
    label: "Bulk orders",
    body: "Pallet and multi-SKU jobsite orders.",
    icon: Package,
  },
  {
    href: "/returns",
    label: "Start a return",
    body: "RMA steps, eligibility, and defective items.",
    icon: RefreshCw,
  },
] as const;

export default function ContactPage() {
  const addressLine = `${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.state} ${SITE_CONFIG.address.postalCode}`;

  return (
    <div className="container-titan py-10 lg:py-14">
      <header className="border-b border-border-gray pb-8">
        <div className="max-w-3xl border-l-4 border-titan-yellow pl-5">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-medium-gray">
            Reach the team
          </p>
          <h1 className="mt-2 font-heading text-4xl uppercase leading-[1.05] tracking-wide text-dark-charcoal md:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-medium-gray">
            Product specs, freight, bulk pricing, or an order that needs a
            human — Houston-based support for contractors, municipalities, and
            industrial buyers.
          </p>
        </div>
      </header>

      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <li key={channel.label}>
            <a
              href={channel.href}
              className="group flex items-start gap-3 border border-border-gray bg-white px-3 py-2.5 transition-colors hover:border-dark-charcoal/40 hover:bg-light-gray/40"
            >
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border border-border-gray bg-light-gray/60 text-dark-charcoal transition-colors group-hover:border-titan-yellow group-hover:bg-titan-yellow/30">
                <channel.icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
                  {channel.label}
                </span>
                <span className="mt-0.5 block truncate text-sm font-medium text-dark-charcoal group-hover:underline group-hover:underline-offset-2">
                  {channel.value}
                </span>
                <span className="mt-0.5 block text-xs text-medium-gray">
                  {channel.hint}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <aside className="space-y-8 lg:max-w-md">
          <section aria-labelledby="hours-heading">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-dark-charcoal" aria-hidden="true" />
              <h2
                id="hours-heading"
                className="font-heading text-lg uppercase tracking-wide text-dark-charcoal"
              >
                Hours
              </h2>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-border-gray py-2">
                <dt className="text-medium-gray">Monday – Friday</dt>
                <dd className="font-medium tabular-nums text-dark-charcoal">
                  8:00am – 5:00pm CT
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-gray py-2">
                <dt className="text-medium-gray">Saturday – Sunday</dt>
                <dd className="font-medium text-dark-charcoal">Closed</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-medium-gray">
              Most quote and support emails get a same-business-day reply.
              Freight scheduling can take longer on oversized SKUs.
            </p>
          </section>

          <section aria-labelledby="location-heading">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-dark-charcoal" aria-hidden="true" />
              <h2
                id="location-heading"
                className="font-heading text-lg uppercase tracking-wide text-dark-charcoal"
              >
                Warehouse &amp; office
              </h2>
            </div>
            <address className="mt-3 not-italic text-sm leading-relaxed text-medium-gray">
              <span className="flex items-start gap-2">
                <Building2
                  className="mt-0.5 size-4 shrink-0 text-dark-charcoal"
                  aria-hidden="true"
                />
                <span>
                  {SITE_CONFIG.address.line1}
                  <br />
                  {addressLine}
                </span>
              </span>
            </address>
            <p className="mt-3 text-sm text-medium-gray">
              Pickup and will-call available by appointment for local orders.
            </p>
          </section>

          <section aria-labelledby="quick-links-heading">
            <h2
              id="quick-links-heading"
              className="font-heading text-lg uppercase tracking-wide text-dark-charcoal"
            >
              Faster paths
            </h2>
            <ul className="mt-3 divide-y divide-border-gray border border-border-gray">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-light-gray/60"
                  >
                    <item.icon
                      className="mt-0.5 size-4 shrink-0 text-dark-charcoal"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-medium-gray">
                        {item.body}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section
          className="border border-border-gray bg-white px-4 py-5 sm:px-6 sm:py-7"
          aria-labelledby="message-heading"
        >
          <h2
            id="message-heading"
            className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal"
          >
            Send a message
          </h2>
          <p className="mt-2 text-sm text-medium-gray">
            Include order numbers, SKUs, or ship-to ZIP when you have them —
            it cuts the back-and-forth.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
          <p className="mt-5 border-t border-border-gray pt-4 text-xs text-medium-gray">
            Prefer email? Write{" "}
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
            >
              {SITE_CONFIG.supportEmail}
            </a>{" "}
            or call{" "}
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
              className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
            >
              {SITE_CONFIG.phoneDisplay}
            </a>
            .
          </p>
        </section>
      </div>

      <section
        className="mt-14 border border-dark-charcoal bg-dark-charcoal px-5 py-7 text-white sm:px-8"
        aria-labelledby="urgent-heading"
      >
        <h2
          id="urgent-heading"
          className="font-heading text-2xl uppercase tracking-wide"
        >
          Need something urgent?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
          For same-day will-call, jobsite shortage replacements, or freight that
          must ship this week, call the sales line and ask for dispatch.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
            className={cn(
              buttonVariants({ variant: "primary" }),
              "inline-flex items-center gap-2",
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
            Call {SITE_CONFIG.phoneDisplay}
          </a>
          <Link
            href="/quote"
            className={cn(buttonVariants({ variant: "outlineInverse" }))}
          >
            Request a quote
          </Link>
        </div>
      </section>
    </div>
  );
}
