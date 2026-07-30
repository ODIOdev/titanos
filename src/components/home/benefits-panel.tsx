import { HeadphonesIcon, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const BENEFITS = [
  {
    title: "Premium Quality",
    description: "ANSI/ISEA-rated gear built for daily jobsite use.",
    icon: ShieldCheck,
  },
  {
    title: "Fast Shipping",
    description: "Most in-stock orders ship within 1–2 business days.",
    icon: Truck,
  },
  {
    title: "Expert Support",
    description: "Talk to real safety specialists — not a chatbot.",
    icon: HeadphonesIcon,
  },
] as const;

export type BenefitsPanelProps = {
  className?: string;
};

export function BenefitsPanel({ className }: BenefitsPanelProps) {
  return (
    <section
      className={cn(
        "border-y border-border-gray bg-light-gray",
        className,
      )}
      aria-label="Why choose Titan Safety"
    >
      <div className="container-titan">
        <ul className="grid divide-y divide-border-gray sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {BENEFITS.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="flex items-start gap-4 px-0 py-6 sm:px-6 sm:py-7 first:sm:pl-0 last:sm:pr-0"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-base uppercase tracking-wide text-dark-charcoal">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-medium-gray">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
