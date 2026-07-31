"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export type AnalyticsRevenueChartProps = {
  data: { date: string; revenue: number }[];
};

export function AnalyticsRevenueChart({ data }: AnalyticsRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="titan-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c400" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f5c400" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={76}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f5c400"
          strokeWidth={2}
          fill="url(#titan-revenue-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
