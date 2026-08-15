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
      <p className="px-4 py-10 text-center text-xs text-medium-gray">
        Device mix appears after the first visits.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-4 @5xl:px-5">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
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
      <ul className="min-w-0 flex-1 space-y-2">
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
