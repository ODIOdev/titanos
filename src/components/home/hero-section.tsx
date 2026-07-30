import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export type HeroSectionProps = {
  className?: string;
};

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-near-black",
        className,
      )}
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#101820_0%,#090d11_55%,#15202c_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(245,196,0,0.08),transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(90deg,transparent,rgba(16,24,32,0.35))] lg:block" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-titan-yellow" />
      </div>

      <div className="container-titan">
        <div className="flex min-h-[28rem] max-w-3xl flex-col justify-center py-16 sm:min-h-[32rem] sm:py-20 lg:min-h-[34rem] lg:py-24">
          <p className="eyebrow-accent animate-fade-up">
            {SITE_CONFIG.name}
          </p>
          <p className="animate-fade-up-delay mt-3 font-heading text-xs uppercase tracking-[0.18em] text-white/70 sm:text-sm">
            Built for work. Designed for safety.
          </p>
          <h1
            id="hero-heading"
            className="animate-fade-up-delay mt-4 font-heading text-4xl uppercase leading-[1.05] tracking-wide text-white sm:text-5xl lg:text-6xl"
          >
            Protecting people.
            <span className="mt-1 block text-titan-yellow">
              Powering progress.
            </span>
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Professional safety gear, workwear, footwear, signage, and
            traffic-control products — ready for your crew and jobsite.
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Shop All Products
            </Link>
            <Link
              href="/quote"
              className={cn(
                buttonVariants({ variant: "outlineInverse", size: "lg" }),
              )}
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
