import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { INDUSTRY_SOLUTIONS } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export type IndustrySolutionsProps = {
  className?: string;
};

/** Enough tiles so one marquee lap is wider than a phone viewport before duplication. */
const MARQUEE_LAP = Array.from(
  { length: Math.max(3, Math.ceil(6 / Math.max(INDUSTRY_SOLUTIONS.length, 1))) },
  () => INDUSTRY_SOLUTIONS,
).flat();
const MARQUEE_ITEMS = [...MARQUEE_LAP, ...MARQUEE_LAP];

export function IndustrySolutions({ className }: IndustrySolutionsProps) {
  return (
    <section
      className={cn("bg-light-gray py-0 @3xl:py-12 @5xl:py-14", className)}
      aria-label="Industry solutions"
    >
      {/* Mobile / phone-preview: flush one-row auto-scroll tape */}
      <div className="@3xl:hidden">
        <div className="marquee-viewport relative overflow-hidden">
          <ul
            className="animate-marquee flex w-max items-stretch"
            style={
              {
                "--marquee-duration": `${MARQUEE_LAP.length * 3.5}s`,
              } as CSSProperties
            }
          >
            {MARQUEE_ITEMS.map((industry, index) => (
              <li
                key={`${industry.slug}-${index}`}
                className="w-[9.5rem] shrink-0"
                aria-hidden={index >= MARQUEE_LAP.length}
              >
                <Link
                  href={industry.href}
                  tabIndex={index >= MARQUEE_LAP.length ? -1 : undefined}
                  aria-label={`Shop ${industry.name} solutions`}
                  className="group relative block overflow-hidden bg-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-titan-yellow"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-dark-charcoal">
                    <Image
                      src={industry.image_url}
                      alt=""
                      fill
                      className="object-contain object-center"
                      sizes="152px"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-near-black/90 via-near-black/40 to-transparent px-2 pb-2 pt-8">
                      <p className="font-heading text-[0.65rem] uppercase leading-tight tracking-wide text-white">
                        {industry.name}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tablet / desktop: headed grid */}
      <div className="container-titan hidden @3xl:block">
        <SectionHeader
          title="Industry solutions"
          titleId="industry-solutions-heading"
          description="Gear kits and categories tailored to the crews and agencies we outfit every day."
        />

        <ul className="grid grid-cols-2 gap-4 @5xl:grid-cols-4">
          {INDUSTRY_SOLUTIONS.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={industry.href}
                className="flex h-full flex-col overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color] duration-200 hover:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-dark-charcoal">
                  <Image
                    src={industry.image_url}
                    alt={industry.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col bg-dark-charcoal p-5">
                  <h3 className="font-heading text-lg uppercase tracking-wide text-white @5xl:text-xl">
                    {industry.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                    {industry.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-titan-yellow">
                    Shop Solutions
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
