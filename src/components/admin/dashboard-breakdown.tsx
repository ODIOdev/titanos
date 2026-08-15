"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#101820",
  "#f5c400",
  "#33465a",
  "#c79f05",
  "#4a6076",
  "#1f2d3a",
] as const;

function share(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function fillWidth(value: number, max: number): string {
  return `${max > 0 ? Math.max((value / max) * 100, 3) : 0}%`;
}

export function CategorySalesBreakdown({
  data,
  compact = false,
}: {
  data: { category: string; sales: number }[];
  compact?: boolean;
}) {
  const total = data.reduce((sum, row) => sum + row.sales, 0);
  const chartData = data.map((row) => ({
    name: row.category,
    value: row.sales,
  }));

  if (data.length === 0) {
    return <EmptyState message="No category sales yet." />;
  }

  if (compact) {
    const leader = data[0]!;
    const runnerUp = data[1] ?? null;
    const leaderPct = share(leader.sales, total);
    const gap =
      runnerUp != null
        ? share(leader.sales - runnerUp.sales, total)
        : leaderPct;

    return (
      <div className="px-3 py-2.5">
        <div className="flex gap-3">
          <div className="relative h-[132px] w-[132px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={58}
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {chartData.map((row, index) => (
                    <Cell
                      key={row.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    fontSize: 11,
                    padding: "4px 8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
                Total
              </p>
              <p className="font-heading text-sm font-bold tabular-nums leading-tight text-dark-charcoal">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <StatChip label="Cats" value={String(data.length)} />
              <StatChip label="Leader" value={`${leaderPct}%`} accent />
              <StatChip
                label="Lead by"
                value={runnerUp ? `${gap} pts` : "Solo"}
              />
            </div>

            <div className="rounded-sm border border-border-gray bg-light-gray/40 px-2.5 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
                Top category
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-dark-charcoal">
                {leader.category}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                  <span
                    className="block h-full rounded-full bg-titan-yellow"
                    style={{ width: `${Math.max(leaderPct, 4)}%` }}
                  />
                </span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-dark-charcoal">
                  {formatCurrency(leader.sales)}
                </span>
              </div>
            </div>

            <div
              className="flex h-3 overflow-hidden rounded-sm bg-light-gray"
              role="img"
              aria-label="Category share"
            >
              {data.map((row, index) => (
                <span
                  key={row.category}
                  title={`${row.category}: ${share(row.sales, total)}%`}
                  className="h-full min-w-[3px] transition-[width]"
                  style={{
                    width: `${Math.max(share(row.sales, total), 1)}%`,
                    backgroundColor:
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <ul className="mt-2.5 space-y-2 border-t border-border-gray pt-2.5">
          {data.map((row, index) => {
            const pct = share(row.sales, total);
            return (
              <li key={row.category}>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-dark-charcoal">
                    {row.category}
                  </span>
                  <span className="w-10 text-right text-[10px] font-semibold tabular-nums text-medium-gray">
                    {pct}%
                  </span>
                  <span className="w-[4.25rem] text-right text-xs font-semibold tabular-nums text-dark-charcoal">
                    {formatCurrency(row.sales)}
                  </span>
                </div>
                <div className="mt-1 ml-4 h-1 overflow-hidden rounded-full bg-light-gray">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor:
                        CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-[168px] w-[168px] shrink-0 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={data.length > 1 ? 2.5 : 0}
                stroke="none"
              >
                {chartData.map((row, index) => (
                  <Cell
                    key={row.name}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Revenue",
                ]}
                contentStyle={{
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
              Mix
            </p>
            <p className="font-heading text-lg font-bold tabular-nums leading-tight text-dark-charcoal">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div
            className="flex h-3 overflow-hidden rounded-sm bg-light-gray"
            role="img"
            aria-label="Category revenue share"
          >
            {data.map((row, index) => (
              <span
                key={row.category}
                className="h-full min-w-[3px]"
                style={{
                  width: `${Math.max(share(row.sales, total), 1)}%`,
                  backgroundColor:
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                }}
              />
            ))}
          </div>
          <ul className="divide-y divide-border-gray">
            {data.map((row, index) => (
              <li
                key={row.category}
                className="flex items-center gap-2 py-2 first:pt-0"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-dark-charcoal">
                  {row.category}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(row.sales)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TopProductsBreakdown({
  data,
  compact = false,
}: {
  data: { name: string; sales: number; quantity: number }[];
  compact?: boolean;
}) {
  const maxSales = Math.max(...data.map((row) => row.sales), 0);
  const units = data.reduce((sum, row) => sum + row.quantity, 0);
  const revenue = data.reduce((sum, row) => sum + row.sales, 0);

  if (data.length === 0) {
    return <EmptyState message="No product sales yet." />;
  }

  if (compact) {
    return (
      <div className="px-3 py-2.5">
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          <MiniStat label="Rev" value={formatCurrency(revenue)} />
          <MiniStat label="Units" value={String(units)} />
          <MiniStat
            label="Avg"
            value={units > 0 ? formatCurrency(revenue / units) : "—"}
          />
        </div>
        <ul className="space-y-2">
          {data.map((row, index) => (
            <li key={row.name}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-sm font-heading text-[10px] font-bold",
                    index === 0
                      ? "bg-titan-yellow text-dark-charcoal"
                      : "bg-light-gray text-medium-gray",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-dark-charcoal">
                  {row.name}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-dark-charcoal">
                  {formatCurrency(row.sales)}
                </span>
              </div>
              <div className="mt-1 ml-7 flex items-center gap-2">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-light-gray">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      index === 0 ? "bg-titan-yellow" : "bg-dark-charcoal",
                    )}
                    style={{ width: fillWidth(row.sales, maxSales) }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-medium-gray">
                  {row.quantity} u
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-5">
      <ul className="space-y-3">
        {data.map((row, index) => (
          <li key={row.name} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm font-heading text-xs font-bold",
                index === 0
                  ? "bg-titan-yellow text-dark-charcoal"
                  : "bg-light-gray text-medium-gray",
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(row.sales)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-light-gray">
                <div
                  className="h-full rounded-full bg-dark-charcoal"
                  style={{ width: fillWidth(row.sales, maxSales) }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/70 bg-white/55 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </p>
      <p className="truncate font-heading text-xs font-bold tabular-nums text-dark-charcoal">
        {value}
      </p>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border px-2 py-1.5",
        accent
          ? "border-titan-yellow/50 bg-titan-yellow/15"
          : "border-border-gray bg-light-gray/50",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </p>
      <p className="truncate font-heading text-xs font-bold tabular-nums text-dark-charcoal">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-3 py-6 text-center text-xs text-medium-gray">{message}</p>
  );
}
