import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  yellow: {
    icon: "bg-titan-yellow/25 text-[#8a6d00]",
    tint: "from-titan-yellow/25 via-titan-yellow/5 to-transparent",
    alert: "text-[#8a6d00]",
  },
  charcoal: {
    icon: "bg-dark-charcoal/10 text-dark-charcoal",
    tint: "from-dark-charcoal/10 via-dark-charcoal/[0.03] to-transparent",
    alert: "text-dark-charcoal",
  },
  green: {
    icon: "bg-emerald-100/80 text-emerald-700",
    tint: "from-emerald-200/50 via-emerald-50/30 to-transparent",
    alert: "text-emerald-700",
  },
  blue: {
    icon: "bg-sky-100/80 text-sky-700",
    tint: "from-sky-200/50 via-sky-50/30 to-transparent",
    alert: "text-sky-700",
  },
  orange: {
    icon: "bg-orange-100/80 text-orange-700",
    tint: "from-orange-200/55 via-orange-50/30 to-transparent",
    alert: "text-orange-700",
  },
  red: {
    icon: "bg-red-100/80 text-red-700",
    tint: "from-red-200/55 via-red-50/30 to-transparent",
    alert: "text-red-700",
  },
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
  /** Compact frosted-glass control (overview shortcut row). */
  variant?: "card" | "glass";
};

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "charcoal",
  href,
  alert = false,
  variant = "card",
}: DashboardStatCardProps) {
  const palette = TONES[tone];

  if (variant === "glass") {
    const body = (
      <>
        <span
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br",
            palette.tint,
          )}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-white/80"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
            {label}
          </p>
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-sm border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
              palette.icon,
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
          </span>
        </div>
        <p
          className={cn(
            "mt-1 font-heading text-lg font-bold tabular-nums leading-none",
            alert ? "text-red-700" : "text-dark-charcoal",
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-[10px] leading-snug text-medium-gray">
            {hint}
          </p>
        ) : null}
      </>
    );

    const className = cn(
      "group relative isolate block overflow-hidden rounded-sm border border-white/70 bg-white/55 px-2.5 py-2 backdrop-blur-md",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.05)]",
      "transition-all",
      href &&
        "hover:-translate-y-px hover:border-white hover:bg-white/75 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_16px_rgba(16,24,40,0.1)] active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(16,24,40,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
      alert && "border-red-200/80 ring-1 ring-red-200/60",
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

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-sm",
            palette.icon,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-2xl font-semibold sm:text-3xl",
          alert ? "text-red-700" : "text-dark-charcoal",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-medium-gray sm:text-sm">{hint}</p>
      ) : null}
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
