import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Package, Users } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  {
    title: "OSHA Compliant",
    description: "All products meet or exceed industry standards.",
    icon: BadgeCheck,
  },
  {
    title: "Trusted by Professionals",
    description:
      "Contractors, municipalities, and crews across the country.",
    icon: Users,
  },
  {
    title: "Bulk Pricing Available",
    description: "Save more on large orders and recurring purchases.",
    icon: Package,
  },
] as const;

const BRAND_LOGOS = [
  { name: "3M", src: "/images/brands/3m.svg" },
  { name: "DeWalt", src: "/images/brands/dewalt.svg" },
  { name: "Carhartt", src: "/images/brands/carhartt.svg" },
  { name: "Milwaukee", src: "/images/brands/milwaukee.svg" },
  { name: "Honeywell", src: "/images/brands/honeywell.svg" },
] as const;

export type TrustStripProps = {
  className?: string;
};

export function TrustStrip({ className }: TrustStripProps) {
  return (
    <section
      className={cn("bg-dark-charcoal py-12 sm:py-14", className)}
      aria-labelledby="trust-strip-heading"
    >
      <div className="container-titan">
        <h2 id="trust-strip-heading" className="sr-only">
          Why professionals trust Titan Safety Co.
        </h2>

        <ul className="grid gap-8 md:grid-cols-3 md:gap-8">
          {TRUST_ITEMS.map(({ title, description, icon: Icon }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-base uppercase tracking-wide text-white">
                  {title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

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
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {BRAND_LOGOS.map((brand) => (
              <li key={brand.name}>
                <Image
                  src={brand.src}
                  alt={`${brand.name} logo`}
                  width={120}
                  height={36}
                  className="h-8 w-auto opacity-80 grayscale transition-[filter,opacity] duration-200 hover:opacity-100 hover:grayscale-0"
                />
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-xs text-white/50">
            {SITE_CONFIG.brandNote}
          </p>
        </div>
      </div>
    </section>
  );
}
