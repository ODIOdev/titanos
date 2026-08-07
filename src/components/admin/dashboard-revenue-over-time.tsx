"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalyticsRevenueChart } from "@/components/admin/analytics-revenue-chart";
import type { RevenuePoint, RevenueRangeKey } from "@/lib/data/admin";
import { cn, formatCurrency } from "@/lib/utils";

const RANGES: { id: RevenueRangeKey; label: string; caption: string }[] = [
  { id: "1d", label: "1D", caption: "Today" },
  { id: "7d", label: "7D", caption: "Last 7 days" },
  { id: "30d", label: "30D", caption: "Last 30 days" },
  { id: "all", label: "All", caption: "All time" },
];

export function DashboardRevenueOverTime({
  seriesByRange,
  className,
}: {
  seriesByRange: Record<RevenueRangeKey, RevenuePoint[]>;
  className?: string;
}) {
  const [range, setRange] = useState<RevenueRangeKey>("7d");
  const active = RANGES.find((r) => r.id === range) ?? RANGES[1]!;
  const data = seriesByRange[range] ?? [];
  const revenueTotal = data.reduce((sum, point) => sum + point.revenue, 0);
  const expenseTotal = data.reduce((sum, point) => sum + (point.expense ?? 0), 0);

  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border-gray px-3 py-3.5 sm:px-5 @5xl:flex-row @5xl:items-start @5xl:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            Revenue over time
          </h2>
          <p className="mt-0.5 text-xs text-medium-gray">
            {active.caption} · {formatCurrency(revenueTotal)} revenue
            {expenseTotal > 0 ? ` · ${formatCurrency(expenseTotal)} expense` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-sm border border-border-gray bg-light-gray/60 p-0.5"
            role="group"
            aria-label="Revenue time range"
          >
            {RANGES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                aria-pressed={range === option.id}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  range === option.id
                    ? "bg-white text-dark-charcoal shadow-sm"
                    : "text-medium-gray hover:text-dark-charcoal",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link
            href="/admin/analytics"
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-medium-gray transition-colors hover:text-dark-charcoal"
          >
            Full reports
          </Link>
        </div>
      </div>
      <div className="px-2 py-4 sm:px-4">
        <AnalyticsRevenueChart data={data} showExpense />
      </div>
    </section>
  );
}
