import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  yellow: "bg-titan-yellow/15 text-[#8a6d00]",
  charcoal: "bg-dark-charcoal/10 text-dark-charcoal",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky-100 text-sky-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
} as const;

export type DashboardStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  href?: string;
  /** Renders the value in the tone colour to flag rows that need action. */
  alert?: boolean;
};

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "charcoal",
  href,
  alert = false,
}: DashboardStatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-sm",
            TONES[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-3xl font-semibold",
          alert ? "text-red-700" : "text-dark-charcoal",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-medium-gray">{hint}</p> : null}
    </>
  );

  const className = cn(
    "block rounded-sm border border-border-gray bg-white p-4 sm:p-5",
    href &&
      "transition-colors hover:border-dark-charcoal focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:outline-none",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
