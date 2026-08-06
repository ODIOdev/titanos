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

/** Brand logos synced with admin Brands catalog (active brands only). */
export async function TrustStrip({ className }: TrustStripProps) {
  const brands = (await getBrands()).filter(
    (brand) => brand.active && Boolean(brand.logo_url?.trim()),
  );
  const logos = brands.slice(0, 12);

  // The marquee translates by half the track, so one lap must be wider than the
  // viewport before it is duplicated — repeat short brand lists to get there.
  const lapItems = Array.from(
    { length: Math.max(1, Math.ceil(12 / Math.max(logos.length, 1))) },
    () => logos,
  ).flat();
  const marqueeItems = [...lapItems, ...lapItems];

  return (
    <section
      className={cn(
        "home-trust bg-[#c0c5ce] py-5 @3xl:py-12 @5xl:py-14",
        className,
      )}
      aria-labelledby="trust-strip-heading"
    >
      <div className="container-titan">
        <div className="flex flex-col gap-2.5 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:gap-4">
          <div className="max-w-2xl border-l-4 border-titan-yellow pl-3 @3xl:pl-5">
            <p className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-dark-charcoal @3xl:text-xs @3xl:tracking-[0.18em]">
              Why Titan
            </p>
            <h2
              id="trust-strip-heading"
              className="mt-1 font-heading text-xl uppercase leading-[1.05] tracking-wide text-dark-charcoal @3xl:mt-2 @3xl:text-3xl @5xl:text-4xl"
            >
              Why professionals trust {SITE_CONFIG.name}
            </h2>
          </div>
          {logos.length > 0 ? (
            <Link
              href="/brands"
              className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-sm bg-dark-charcoal px-4 font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-near-black @3xl:h-10 @3xl:w-auto @3xl:text-xs"
            >
              Shop brands
            </Link>
          ) : null}
        </div>

        <ul className="mt-3 overflow-hidden rounded-sm border border-white/45 bg-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-md @3xl:mt-8 @3xl:grid @3xl:grid-cols-2 @3xl:gap-3 @3xl:overflow-visible @3xl:rounded-none @3xl:border-0 @3xl:bg-transparent @3xl:shadow-none @3xl:backdrop-blur-none @5xl:grid-cols-4">
          {TRUST_ITEMS.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5",
                "border-b border-dark-charcoal/10 last:border-b-0",
                "@3xl:block @3xl:overflow-hidden @3xl:rounded-sm @3xl:border @3xl:border-white/45 @3xl:bg-white/35 @3xl:p-6 @3xl:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] @3xl:backdrop-blur-md",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-white/50 bg-white/50 text-dark-charcoal @3xl:size-11 @3xl:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)]">
                <Icon className="size-3.5 @3xl:size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-xs uppercase leading-snug tracking-wide text-dark-charcoal @3xl:mt-5 @3xl:text-base">
                  {title}
                </p>
                <p className="mt-0.5 truncate text-[0.7rem] leading-snug text-dark-charcoal/65 @3xl:mt-2 @3xl:whitespace-normal @3xl:text-sm @3xl:leading-relaxed">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {logos.length > 0 ? (
          <div className="mt-4 px-0 py-0 @3xl:mt-10 @3xl:py-2">
            <div className="mb-2 flex items-center gap-3 @3xl:mb-5">
              <span className="h-px flex-1 bg-dark-charcoal/20" />
              <p className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-dark-charcoal @3xl:text-xs @3xl:tracking-[0.18em]">
                Stocked manufacturers
              </p>
              <span className="h-px flex-1 bg-dark-charcoal/20" />
            </div>
            <div className="marquee-viewport relative overflow-hidden bg-[#c0c5ce] [mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]">
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
                      className="flex h-11 w-28 items-center justify-center rounded-sm bg-[#c0c5ce] px-2 focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:outline-none @3xl:h-16 @3xl:w-40 @3xl:px-2.5"
                      aria-label={`Shop ${brand.name}`}
                    >
                      <Image
                        src={brand.logo_url!}
                        alt={`${brand.name} logo`}
                        width={280}
                        height={112}
                        className="h-auto max-h-8 w-auto max-w-full object-contain [mix-blend-mode:multiply] @3xl:max-h-[3.25rem]"
                        unoptimized
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-center text-[0.65rem] text-dark-charcoal/55 @3xl:mt-5 @3xl:text-xs">
              {SITE_CONFIG.brandNote}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
