import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zM17.2 7.3a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4A1.6 1.6 0 1 0 5.1 7.2 1.6 1.6 0 0 0 5.1 4zM20.3 20h-2.8v-5.6c0-1.5-.5-2.5-1.8-2.5a1.9 1.9 0 0 0-1.8 1.3 2.4 2.4 0 0 0-.1.9V20h-2.8s0-8.4 0-10.5h2.8v1.5a3.2 3.2 0 0 1 2.9-1.7c2.1 0 3.7 1.4 3.7 4.4V20z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.7 3h2.9l-6.3 7.2L22 21h-5.7l-4.5-5.9L7 21H4.1l6.8-7.8L2 3h5.8l4 5.4L17.7 3zm-1 16.2h1.6L7.4 4.7H5.7l11 14.5z" />
    </svg>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Safety Equipment", href: "/shop/hard-hats" },
      { label: "Traffic Control", href: "/shop/traffic-cones" },
      { label: "Work Boots", href: "/shop/work-boots" },
      { label: "Street Signs", href: "/shop/street-signs" },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Best Sellers", href: "/shop?sort=best_selling" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQs", href: "/faq" },
      { label: "Request a Quote", href: "/quote" },
      { label: "Bulk Orders", href: "/bulk-orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Titan", href: "/about" },
      { label: "Resources", href: "/resources" },
      { label: "Brands", href: "/brands" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "Orders", href: "/account/orders" },
      { label: "Wishlist", href: "/account/wishlist" },
      { label: "Admin", href: "/admin" },
    ],
  },
] as const;

const SOCIAL = [
  { label: "Facebook", href: SITE_CONFIG.social.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: SITE_CONFIG.social.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", href: SITE_CONFIG.social.linkedin, Icon: LinkedinIcon },
  { label: "X", href: SITE_CONFIG.social.twitter, Icon: XIcon },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-dark-charcoal text-white">
      <div className="container-titan py-12 sm:py-14">
        <div className="mb-10 flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <Image
              src="/images/logo/logo-badge.webp"
              alt={SITE_CONFIG.name}
              width={56}
              height={56}
              className="mb-4 h-12 w-12 object-contain"
            />
            <p className="font-heading text-2xl font-bold uppercase tracking-wide text-titan-yellow">
              {SITE_CONFIG.name}
            </p>
            <p className="mt-2 text-sm text-white/75">{SITE_CONFIG.tagline}</p>
          </div>
          <div className="text-sm text-white/80 lg:text-right">
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
              className="font-heading text-lg uppercase tracking-wide text-white transition-colors hover:text-titan-yellow"
            >
              {SITE_CONFIG.phoneDisplay}
            </a>
            <p className="mt-1">
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="hover:text-titan-yellow"
              >
                {SITE_CONFIG.email}
              </a>
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 transition-colors hover:text-titan-yellow"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-sm border border-white/20 text-white/80 transition-colors hover:border-titan-yellow hover:text-titan-yellow"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>

          <p className="text-xs text-white/55">
            We accept Visa · Mastercard · Amex · Discover · PayPal
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="font-heading uppercase tracking-wide text-white/70">
            {SITE_CONFIG.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
