import Image from "next/image";
import Link from "next/link";
import { FooterBrandLink } from "@/components/layout/footer-brand-link";
import { logout } from "@/lib/actions/auth";
import { getIsSignedIn } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/data/seed-data";

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
] as const;

const SOCIAL = [
  {
    label: "Facebook",
    href: SITE_CONFIG.social.facebook,
    src: "/images/social/facebook.png",
    width: 325,
    height: 325,
  },
  {
    label: "Instagram",
    href: SITE_CONFIG.social.instagram,
    src: "/images/social/instagram.png",
    width: 192,
    height: 192,
  },
  {
    label: "LinkedIn",
    href: SITE_CONFIG.social.linkedin,
    src: "/images/social/linkedin.svg",
    width: 77,
    height: 65,
  },
  {
    label: "X",
    href: SITE_CONFIG.social.twitter,
    src: "/images/social/x.png",
    width: 125,
    height: 128,
  },
] as const;

const PAYMENT_LOGOS = [
  {
    name: "Visa",
    src: "/images/payments/visa.png",
    width: 208,
    height: 68,
  },
  {
    name: "Mastercard",
    src: "/images/payments/mastercard.svg",
    width: 100,
    height: 62,
  },
  {
    name: "American Express",
    src: "/images/payments/amex.svg",
    width: 100,
    height: 28,
  },
  {
    name: "Discover",
    src: "/images/payments/discover.png",
    width: 136,
    height: 23,
  },
  {
    name: "PayPal",
    src: "/images/payments/paypal.png",
    width: 124,
    height: 33,
  },
] as const;

const accountLinkClass = "text-sm text-white/75 transition-colors hover:text-titan-yellow";

export async function Footer() {
  const year = new Date().getFullYear();
  const signedIn = await getIsSignedIn();

  return (
    <footer className="bg-dark-charcoal mt-auto text-white">
      <div className="container-titan py-7 sm:py-8">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <FooterBrandLink
            className="flex max-w-md items-center gap-1"
            label={`${SITE_CONFIG.name} — back to top of home page`}
          >
            <Image
              src="/images/logo/logo-badge.webp"
              alt=""
              width={72}
              height={72}
              className="h-14 w-14 shrink-0 object-contain"
            />
            <span className="min-w-0">
              <span className="font-heading text-titan-yellow block text-2xl font-bold tracking-wide uppercase">
                {SITE_CONFIG.name}
              </span>
              <span className="mt-1 block text-sm text-white/75">
                {SITE_CONFIG.tagline}
              </span>
            </span>
          </FooterBrandLink>
          <div className="text-sm text-white/80 lg:text-right">
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
              className="font-heading hover:text-titan-yellow text-lg tracking-wide text-white uppercase transition-colors"
            >
              {SITE_CONFIG.phoneDisplay}
            </a>
            <p className="mt-1">
              <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-titan-yellow">
                {SITE_CONFIG.email}
              </a>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link href={link.href} className={accountLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
              Account
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                {signedIn ? (
                  <form action={logout}>
                    <button type="submit" className={accountLinkClass}>
                      Sign Out
                    </button>
                  </form>
                ) : (
                  <Link href="/login" className={accountLinkClass}>
                    Sign In
                  </Link>
                )}
              </li>
              {!signedIn ? (
                <li>
                  <Link href="/register" className={accountLinkClass}>
                    Register
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/account/orders" className={accountLinkClass}>
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className={accountLinkClass}>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/affiliates" className={accountLinkClass}>
                  Affiliates
                </Link>
              </li>
              <li>
                <Link href="/admin" className={accountLinkClass}>
                  Master Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 border-t border-white/15 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex items-center gap-1">
              {SOCIAL.map(({ label, href, src, width, height }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-9 items-center justify-center opacity-85 transition-opacity hover:opacity-100"
                  >
                    <Image
                      src={src}
                      alt=""
                      width={width}
                      height={height}
                      className="size-7 object-contain"
                      unoptimized={src.endsWith(".svg")}
                    />
                  </a>
                </li>
              ))}
            </ul>

            <ul className="hidden items-center gap-2 lg:flex lg:justify-end">
              {PAYMENT_LOGOS.map((logo) => (
                <li
                  key={logo.name}
                  className="inline-flex h-8 w-[4.25rem] shrink-0 items-center justify-center rounded-sm border border-white/15 bg-white px-2"
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width}
                    height={logo.height}
                    className="h-4 w-auto max-w-full object-contain"
                    unoptimized={logo.src.endsWith(".svg")}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 text-xs text-white/55">
            <p>
              © {year} {SITE_CONFIG.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
