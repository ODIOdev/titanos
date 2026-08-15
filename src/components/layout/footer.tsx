import Image from "next/image";
import Link from "next/link";
import { FooterBrandLink } from "@/components/layout/footer-brand-link";
import { FooterMobileSection } from "@/components/layout/footer-mobile-section";
import { PAYMENT_LOGOS } from "@/components/shared/payment-method-logos";
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

const linkClass =
  "text-sm text-white/75 transition-colors hover:text-titan-yellow";

function AccountLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <ul className="space-y-2.5">
      <li>
        {signedIn ? (
          <form action={logout}>
            <button type="submit" className={linkClass}>
              Sign Out
            </button>
          </form>
        ) : (
          <Link href="/login" className={linkClass}>
            Sign In
          </Link>
        )}
      </li>
      {!signedIn ? (
        <li>
          <Link href="/register" className={linkClass}>
            Register
          </Link>
        </li>
      ) : null}
      <li>
        <Link href="/account/orders" className={linkClass}>
          Orders
        </Link>
      </li>
      <li>
        <Link href="/wishlist" className={linkClass}>
          Wishlist
        </Link>
      </li>
      <li>
        <Link href="/affiliates" className={linkClass}>
          Affiliates
        </Link>
      </li>
      <li className="storefront-footer-admin">
        <Link href="/admin" className={linkClass}>
          Master Admin
        </Link>
      </li>
    </ul>
  );
}

function ColumnLinks({
  links,
}: {
  links: readonly { label: string; href: string }[];
}) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();
  const signedIn = await getIsSignedIn();

  return (
    <footer className="storefront-footer mt-auto bg-dark-charcoal text-white">
      <div className="container-titan py-6 @3xl:py-8">
        {/* Brand + contact */}
        <div className="mb-5 border-b border-white/10 pb-5 @5xl:mb-6 @5xl:flex @5xl:items-center @5xl:justify-between @5xl:gap-6 @5xl:pb-6">
          <FooterBrandLink
            className="inline-block"
            label={`${SITE_CONFIG.name} — back to top of home page`}
          >
            <Image
              src="/images/logo/logo-landscape.png"
              alt={SITE_CONFIG.name}
              width={763}
              height={247}
              className="h-12 w-auto max-w-[min(100%,16rem)] object-contain object-left @3xl:h-14 @3xl:max-w-[18rem]"
              unoptimized
            />
          </FooterBrandLink>

          <div className="mt-4 flex flex-col gap-1.5 text-sm @5xl:mt-0 @5xl:text-right">
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
              className="font-heading text-base tracking-wide text-white uppercase transition-colors hover:text-titan-yellow @3xl:text-lg"
            >
              {SITE_CONFIG.phoneDisplay}
            </a>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-white/75 transition-colors hover:text-titan-yellow"
            >
              {SITE_CONFIG.email}
            </a>
          </div>
        </div>

        {/* Mobile: accordion link groups */}
        <div className="storefront-footer-mobile border-b border-white/10 @5xl:hidden">
          {FOOTER_COLUMNS.map((column) => (
            <FooterMobileSection key={column.title} title={column.title}>
              <ColumnLinks links={column.links} />
            </FooterMobileSection>
          ))}
          <FooterMobileSection title="Account">
            <AccountLinks signedIn={signedIn} />
          </FooterMobileSection>
        </div>

        {/* Desktop: multi-column link grid */}
        <div className="storefront-footer-desktop hidden grid-cols-2 gap-x-6 gap-y-6 @5xl:grid @5xl:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
                {column.title}
              </h2>
              <div className="mt-3">
                <ColumnLinks links={column.links} />
              </div>
            </div>
          ))}
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
              Account
            </h2>
            <div className="mt-3">
              <AccountLinks signedIn={signedIn} />
            </div>
          </div>
        </div>

        {/* Social + payments + legal */}
        <div className="mt-5 pt-1 @5xl:mt-6 @5xl:border-t @5xl:border-white/15 @5xl:pt-5">
          <div className="flex flex-col items-center gap-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
            <ul className="flex items-center gap-1">
              {SOCIAL.map(({ label, href, src, width, height }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-10 items-center justify-center opacity-85 transition-opacity hover:opacity-100 @3xl:size-9"
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

            <ul className="hidden items-center gap-1.5 @5xl:flex @5xl:justify-end">
              {PAYMENT_LOGOS.map((logo) => (
                <li
                  key={logo.name}
                  className="inline-flex h-8 w-[4.5rem] shrink-0 items-center justify-center overflow-visible rounded-sm border border-white/15 bg-white px-1.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width}
                    height={logo.height}
                    className="block h-[1.125rem] w-auto max-w-[3.75rem] object-contain object-center"
                    decoding="async"
                  />
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-center text-xs text-white/50 @3xl:text-left @3xl:text-white/55">
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
