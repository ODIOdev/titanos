import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Package, Phone, Users } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { getBrands } from "@/lib/data/products";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  {
    title: "OSHA Compliant",
    description: "All products meet or exceed industry standards.",
    icon: BadgeCheck,
  },
  {
    title: "Trusted by Professionals",
    description: "Contractors, municipalities, and crews across the country.",
    icon: Users,
  },
  {
    title: "Bulk Pricing Available",
    description: "Save more on large orders and recurring purchases.",
    icon: Package,
  },
  {
    title: "Spec Help On Call",
    description: `Talk through requirements with a specialist at ${SITE_CONFIG.phoneDisplay}.`,
    icon: Phone,
  },
] as const;

export type TrustStripProps = {
  className?: string;
};

/** Brand logos synced with admin Brands catalog. */
export async function TrustStrip({ className }: TrustStripProps) {
  const brands = await getBrands();
  const logos = brands.filter((b) => b.active && b.logo_url).slice(0, 12);

  // The marquee translates by half the track, so one lap must be wider than the
  // viewport before it is duplicated — repeat short brand lists to get there.
  const lapItems = Array.from(
    { length: Math.max(1, Math.ceil(12 / Math.max(logos.length, 1))) },
    () => logos,
  ).flat();
  const marqueeItems = [...lapItems, ...lapItems];

  return (
    <section
      className={cn("bg-dark-charcoal py-12 sm:py-14", className)}
      aria-labelledby="trust-strip-heading"
    >
      <div className="container-titan">
        <div className="border-l-4 border-titan-yellow pl-4 sm:pl-5">
          <p className="eyebrow-accent">Why Titan</p>
          <h2
            id="trust-strip-heading"
            className="mt-2 font-heading text-2xl uppercase tracking-wide text-white sm:text-3xl"
          >
            Why professionals trust {SITE_CONFIG.name}
          </h2>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="rounded-sm border border-white/10 bg-white/[0.04] p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-heading text-sm uppercase tracking-wide text-white">
                {title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                {description}
              </p>
            </li>
          ))}
        </ul>

        {logos.length > 0 ? (
          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="eyebrow-accent">Stocked manufacturers</p>
              <Link
                href="/brands"
                className="link-underline font-heading text-xs font-semibold uppercase tracking-wide text-titan-yellow"
              >
                Shop brands
              </Link>
            </div>
            <div className="marquee-viewport relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]">
              <ul
                className="animate-marquee flex w-max items-stretch gap-3"
                style={
                  {
                    "--marquee-duration": `${lapItems.length * 5}s`,
                  } as CSSProperties
                }
              >
                {marqueeItems.map((brand, index) => (
                  <li
                    key={`${brand.id}-${index}`}
                    aria-hidden={index >= lapItems.length}
                  >
                    <Link
                      href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
                      tabIndex={index >= lapItems.length ? -1 : undefined}
                      className="flex h-16 w-40 items-center justify-center rounded-sm border border-white/10 bg-white/90 px-2.5 transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:outline-none"
                      aria-label={`Shop ${brand.name}`}
                    >
                      <Image
                        src={brand.logo_url!}
                        alt={`${brand.name} logo`}
                        width={280}
                        height={112}
                        className="h-auto max-h-[3.25rem] w-auto max-w-full object-contain"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-10 text-center text-xs text-white/50">
              {SITE_CONFIG.brandNote}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
