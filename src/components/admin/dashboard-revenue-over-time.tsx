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
  compact = false,
  title = "Cash pulse",
  actionHref = "/admin/analytics",
  actionLabel = "Reports",
  chartHeight,
  defaultRange = "7d",
}: {
  seriesByRange: Record<RevenueRangeKey, RevenuePoint[]>;
  className?: string;
  compact?: boolean;
  title?: string;
  actionHref?: string;
  actionLabel?: string;
  chartHeight?: number;
  defaultRange?: RevenueRangeKey;
}) {
  const [range, setRange] = useState<RevenueRangeKey>(defaultRange);
  const active = RANGES.find((r) => r.id === range) ?? RANGES[1]!;
  const data = seriesByRange[range] ?? [];
  const revenueTotal = data.reduce((sum, point) => sum + point.revenue, 0);
  const expenseTotal = data.reduce(
    (sum, point) => sum + (point.expense ?? 0),
    0,
  );
  const height = chartHeight ?? (compact ? 180 : 280);

  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border-gray",
          compact ? "px-3 py-2" : "px-4 py-3 @5xl:px-5",
        )}
      >
        <div className="min-w-0">
          <h2
            className={cn(
              "font-heading font-semibold uppercase tracking-wide text-dark-charcoal",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "text-medium-gray",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {active.caption} ·{" "}
            <span className="text-dark-charcoal">
              {formatCurrency(revenueTotal)}
            </span>{" "}
            revenue
            {expenseTotal > 0 ? (
              <>
                {" · "}
                <span className="text-red-600">
                  {formatCurrency(expenseTotal)}
                </span>{" "}
                expense
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-sm border border-white/70 bg-white/55 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md"
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
                  "rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  range === option.id
                    ? "bg-dark-charcoal text-white"
                    : "text-medium-gray hover:text-dark-charcoal",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link
            href={actionHref}
            className={cn(
              "shrink-0 font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {actionLabel}
          </Link>
        </div>
      </div>
      <div
        className={cn(
          compact ? "px-2 py-2" : "px-2 py-4 @5xl:px-4 @5xl:py-5",
        )}
      >
        <AnalyticsRevenueChart
          data={data}
          showExpense
          height={height}
          compact={compact}
        />
      </div>
    </section>
  );
}
