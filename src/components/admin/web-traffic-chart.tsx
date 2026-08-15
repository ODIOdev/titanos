"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrafficPoint } from "@/lib/data/web-traffic-shared";
import { formatTrafficCount } from "@/lib/data/web-traffic-shared";

export function WebTrafficChart({
  data,
  height = 280,
}: {
  data: TrafficPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="traffic-views-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c400" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f5c400" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          height={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
          tickFormatter={(value) => formatTrafficCount(Number(value))}
        />
        <Tooltip
          formatter={(value, name) => [
            formatTrafficCount(Number(value)),
            String(name),
          ]}
          labelStyle={{ fontWeight: 600, color: "#1a1d21", fontSize: 11 }}
          contentStyle={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            fontSize: 11,
            background: "#fff",
          }}
        />
        <Area
          type="monotone"
          dataKey="pageviews"
          name="Page views"
          stroke="#f5c400"
          strokeWidth={2}
          fill="url(#traffic-views-fill)"
        />
        <Line
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke="#101820"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#101820" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
