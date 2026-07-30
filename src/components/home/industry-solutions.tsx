import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { INDUSTRY_SOLUTIONS } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export type IndustrySolutionsProps = {
  className?: string;
};

export function IndustrySolutions({ className }: IndustrySolutionsProps) {
  return (
    <section
      className={cn("section-y bg-light-gray", className)}
      aria-labelledby="industry-solutions-heading"
    >
      <div className="container-titan">
        <SectionHeader
          eyebrow="Built for your jobsite"
          title="Industry solutions"
          titleId="industry-solutions-heading"
          description="Gear kits and categories tailored to the crews and agencies we outfit every day."
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRY_SOLUTIONS.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={industry.href}
                className="group flex h-full flex-col overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color] duration-200 hover:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-dark-charcoal">
                  <Image
                    src={industry.image_url}
                    alt={industry.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col bg-dark-charcoal p-5">
                  <h3 className="font-heading text-xl uppercase tracking-wide text-white">
                    {industry.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                    {industry.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-titan-yellow">
                    Shop Solutions
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
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
