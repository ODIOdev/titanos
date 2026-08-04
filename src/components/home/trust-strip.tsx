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
      className={cn("bg-[#c0c5ce] py-12 sm:py-14", className)}
      aria-labelledby="trust-strip-heading"
    >
      <div className="container-titan">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl border-l-4 border-titan-yellow pl-4 sm:pl-5">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-dark-charcoal">
              Why Titan
            </p>
            <h2
              id="trust-strip-heading"
              className="mt-2 font-heading text-3xl uppercase leading-[1.05] tracking-wide text-dark-charcoal sm:text-4xl"
            >
              Why professionals trust {SITE_CONFIG.name}
            </h2>
          </div>
          {logos.length > 0 ? (
            <Link
              href="/brands"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-dark-charcoal px-4 font-heading text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-near-black"
            >
              Shop brands
            </Link>
          ) : null}
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className="relative overflow-hidden rounded-sm border border-white/45 bg-white/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-sm border border-white/50 bg-white/40 text-dark-charcoal shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-sm">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-heading text-xs font-semibold tabular-nums tracking-wide text-dark-charcoal/35">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-5 font-heading text-base uppercase tracking-wide text-dark-charcoal">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-dark-charcoal/70">
                {description}
              </p>
            </li>
          ))}
        </ul>

        {logos.length > 0 ? (
          <div className="mt-10 px-0 py-2">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-dark-charcoal/20" />
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-dark-charcoal">
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
                      className="flex h-16 w-40 items-center justify-center rounded-sm bg-[#c0c5ce] px-2.5 focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:outline-none"
                      aria-label={`Shop ${brand.name}`}
                    >
                      <Image
                        src={brand.logo_url!}
                        alt={`${brand.name} logo`}
                        width={280}
                        height={112}
                        className="h-auto max-h-[3.25rem] w-auto max-w-full object-contain [mix-blend-mode:multiply]"
                        unoptimized
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 text-center text-xs text-dark-charcoal/55">
              {SITE_CONFIG.brandNote}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
