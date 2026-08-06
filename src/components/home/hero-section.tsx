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

/**
 * Home hero. Uses @container queries (see shop layout `@container`) so the
 * iPhone design shell — which has a desktop viewport — still renders the
 * compact mobile composition inside the phone frame.
 */
export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "home-hero relative isolate flex flex-col overflow-hidden bg-near-black",
        "min-h-0 @5xl:min-h-[min(100svh,52rem)]",
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,13,17,0.5)_0%,transparent_30%,transparent_70%,rgba(9,13,17,0.75)_100%)]" />
      </div>

      <div className="container-titan relative flex flex-1 flex-col justify-center py-8 @3xl:py-12 @5xl:py-16">
        <div className="grid items-center gap-6 @3xl:gap-10 @5xl:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] @5xl:gap-12">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="animate-fade-up inline-block"
              aria-label={SITE_CONFIG.name}
            >
              {/* Mobile / phone-preview wordmark */}
              <Image
                src="/images/logo/logo-landscape-hero.png"
                alt={SITE_CONFIG.name}
                width={919}
                height={300}
                className="home-hero-logo h-14 w-auto max-w-full object-contain @3xl:hidden"
                priority
                unoptimized
              />
              {/* Desktop keeps the original landscape logo */}
              <Image
                src="/images/logo/logo-landscape.png"
                alt=""
                width={763}
                height={247}
                className="home-hero-logo hidden h-20 w-auto object-contain @3xl:block @5xl:h-28"
                aria-hidden="true"
                priority
              />
            </Link>

            <p className="animate-fade-up-delay mt-4 font-heading text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-titan-yellow @3xl:mt-8 @3xl:text-xs @3xl:tracking-[0.22em] @5xl:mt-10 @5xl:text-sm">
              Keeping detours safe.
            </p>

            <h1
              id="hero-heading"
              className="home-hero-title animate-fade-up-delay mt-2 font-heading text-[1.85rem] font-bold uppercase leading-[0.98] tracking-wide text-white @3xl:mt-3 @3xl:text-[2.65rem] @3xl:leading-[0.95] @5xl:text-7xl"
            >
              Protecting
              <span className="block">People.</span>
              <span className="mt-0.5 block text-titan-yellow @3xl:mt-1">
                Powering Progress.
              </span>
            </h1>

            <p className="home-hero-copy animate-fade-up-delay-2 mt-3 hidden max-w-xl text-base leading-relaxed text-white/85 @3xl:mt-5 @3xl:block @3xl:text-lg">
              Professional safety gear and traffic control solutions for
              <span className="mt-1 block font-medium text-titan-yellow">
                every road, every crew, every time.
              </span>
            </p>

            <div className="animate-fade-up-delay-2 mt-5 flex flex-row gap-2 @3xl:mt-9 @3xl:gap-3">
              <Link
                href="/shop"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "min-w-0 flex-1 justify-center whitespace-normal px-2.5 text-center text-xs leading-tight @3xl:w-auto @3xl:flex-none @3xl:whitespace-nowrap @3xl:px-6 @3xl:text-base @3xl:leading-normal",
                )}
              >
                <span className="@3xl:hidden">Shop All</span>
                <span className="hidden @3xl:inline">Shop All Products</span>
                <ArrowRight
                  className="hidden size-4 @3xl:inline"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/quote"
                className={cn(
                  buttonVariants({ variant: "outlineInverse", size: "lg" }),
                  "min-w-0 flex-1 justify-center whitespace-normal border-titan-yellow px-2.5 text-center text-xs leading-tight text-titan-yellow hover:border-titan-yellow hover:bg-titan-yellow/10 @3xl:w-auto @3xl:flex-none @3xl:whitespace-nowrap @3xl:px-6 @3xl:text-base @3xl:leading-normal",
                )}
              >
                <span className="@3xl:hidden">Get a Quote</span>
                <span className="hidden @3xl:inline">Request a Quote</span>
              </Link>
            </div>
          </div>

          <aside className="animate-fade-up-delay-2 w-full max-w-xl justify-self-start @5xl:max-w-none @5xl:justify-self-end">
            {/* Mobile: no panel — white search field on the hero */}
            <div className="home-hero-search @3xl:hidden">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-titan-yellow">
                Find gear fast
              </p>
              <SearchBar
                className="mt-3"
                variant="default"
                size="md"
                inputId="hero-search-mobile"
                placeholder="Search safety gear…"
              />
            </div>

            {/* Tablet/desktop: dark search panel */}
            <div className="home-hero-search relative hidden bg-near-black/90 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl ring-1 ring-titan-yellow @3xl:block @5xl:p-8">
              <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-titan-yellow @5xl:text-base">
                Find gear fast
              </p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white @5xl:text-lg">
                Search hard hats, vests, boots, signs, and traffic control.
              </p>
              <SearchBar
                className="mt-5"
                variant="onDark"
                size="md"
                inputId="hero-search"
              />
            </div>

            <ul className="mt-6 hidden gap-4 @5xl:grid @5xl:grid-cols-3">
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
