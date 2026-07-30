import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About us",
  description: `Learn about ${SITE_CONFIG.name} — professional safety equipment for crews and municipalities.`,
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-dark-charcoal py-14 lg:py-20">
        <div className="container-titan max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-titan-yellow uppercase">
            Our story
          </p>
          <h1 className="mt-3 font-heading text-4xl uppercase tracking-wide text-white md:text-5xl">
            {SITE_CONFIG.name}
          </h1>
          <p className="mt-4 text-lg text-white/75">{SITE_CONFIG.tagline}</p>
        </div>
      </section>

      <section className="container-titan max-w-3xl py-14 lg:py-16">
        <h2 className="font-heading text-3xl uppercase tracking-wide text-dark-charcoal">
          Built for people who work outside the office
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-medium-gray">
          <p>
            {SITE_CONFIG.name} supplies professional safety equipment, reflective
            workwear, work boots, traffic-control products, street signs, hard hats,
            and jobsite PPE to contractors, municipalities, and industrial teams
            across the country.
          </p>
          <p>
            We stock trusted manufacturers alongside our house brand so you can
            outfit a crew without juggling multiple vendors. From a single hard hat
            to a pallet of cones and barricades, our goal is simple: get compliant
            gear on the jobsite fast.
          </p>
          <p>
            Based in {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}, our
            team understands lead times, freight realities, and the specs that keep
            crews protected and projects moving.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
            Shop products
          </Link>
          <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }))}>
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
