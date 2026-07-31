import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, Shield, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Premium Quality",
    description: "Built tough. Built to protect.",
    icon: Shield,
  },
  {
    title: "Fast Shipping",
    description: "When you need it. Where you need it.",
    icon: Truck,
  },
  {
    title: "Expert Support",
    description: "Real people. Real solutions.",
    icon: Headphones,
  },
] as const;

export type HeroSectionProps = {
  className?: string;
};

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[min(100svh,52rem)] flex-col overflow-hidden bg-near-black",
        className,
      )}
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src="/images/hero/hero-jobsite.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,13,17,0.92)_0%,rgba(9,13,17,0.78)_38%,rgba(9,13,17,0.35)_62%,rgba(9,13,17,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,13,17,0.45)_0%,transparent_28%,transparent_72%,rgba(9,13,17,0.7)_100%)]" />
      </div>

      <div className="container-titan relative flex flex-1 flex-col justify-center py-12 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="animate-fade-up inline-block"
              aria-label={SITE_CONFIG.name}
            >
              <Image
                src="/images/logo/logo-landscape.png"
                alt={SITE_CONFIG.name}
                width={763}
                height={247}
                className="h-20 w-auto object-contain sm:h-24 lg:h-28 xl:h-32"
                priority
              />
            </Link>

            <p className="animate-fade-up-delay mt-8 font-heading text-xs font-semibold uppercase tracking-[0.22em] text-titan-yellow sm:mt-10 sm:text-sm">
              Keeping detours safe.
            </p>

            <h1
              id="hero-heading"
              className="animate-fade-up-delay mt-3 font-heading text-[2.65rem] font-bold uppercase leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl"
            >
              Protecting
              <span className="block">People.</span>
              <span className="mt-1 block text-titan-yellow">
                Powering Progress.
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Professional safety gear and traffic control solutions for
              <span className="mt-1 block font-medium text-titan-yellow">
                every road, every crew, every time.
              </span>
            </p>

            <div className="animate-fade-up-delay-2 mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                )}
              >
                Shop All Products
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/quote"
                className={cn(
                  buttonVariants({ variant: "outlineInverse", size: "lg" }),
                  "border-titan-yellow text-titan-yellow hover:border-titan-yellow hover:bg-titan-yellow/10",
                )}
              >
                Request a Quote
              </Link>
            </div>
          </div>

          <aside className="animate-fade-up-delay-2 w-full max-w-xl justify-self-start lg:max-w-none lg:justify-self-end">
            <div className="relative bg-near-black/90 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl ring-1 ring-titan-yellow sm:p-8">
              <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-titan-yellow sm:text-base">
                Find gear fast
              </p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white sm:text-lg">
                Search hard hats, vests, boots, signs, and traffic control.
              </p>
              <SearchBar
                className="mt-5"
                variant="onDark"
                size="lg"
                inputId="hero-search"
              />
            </div>

            <ul className="mt-6 hidden gap-4 lg:grid lg:grid-cols-3">
              {FEATURES.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-titan-yellow"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-white/70">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

