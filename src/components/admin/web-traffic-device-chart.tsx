"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TrafficRanked } from "@/lib/data/web-traffic-shared";
import { formatTrafficCount } from "@/lib/data/web-traffic-shared";

const DEVICE_COLORS = ["#101820", "#f5c400", "#4a6076", "#c79f05"] as const;

export function WebTrafficDeviceChart({ data }: { data: TrafficRanked[] }) {
  const total = data.reduce((sum, row) => sum + row.pageviews, 0);
  const chartData = data.map((row) => ({
    name: row.label,
    value: row.pageviews,
  }));

  if (data.length === 0 || total === 0) {
    return (
      <p className="px-3 py-8 text-center text-[11px] text-medium-gray @5xl:px-4 @5xl:py-10 @5xl:text-xs">
        Device mix appears after the first visits.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-3 py-3 @5xl:flex-row @5xl:items-center @5xl:gap-4 @5xl:px-5 @5xl:py-4">
      <div className="relative h-[108px] w-[108px] shrink-0 @5xl:h-[140px] @5xl:w-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={chartData.length > 1 ? 2 : 0}
              stroke="none"
            >
              {chartData.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatTrafficCount(Number(value)), "Views"]}
              contentStyle={{
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                fontSize: 11,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((row, index) => {
          const share = total > 0 ? Math.round((row.pageviews / total) * 100) : 0;
          return (
            <li key={row.label} className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-xs text-dark-charcoal">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background: DEVICE_COLORS[index % DEVICE_COLORS.length],
                  }}
                />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-dark-charcoal">
                {share}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
