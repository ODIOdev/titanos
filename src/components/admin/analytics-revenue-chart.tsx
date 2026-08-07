"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export type AnalyticsRevenueChartProps = {
  data: { date: string; revenue: number; expense?: number }[];
  height?: number;
  showExpense?: boolean;
};

export function AnalyticsRevenueChart({
  data,
  height = 280,
  showExpense,
}: AnalyticsRevenueChartProps) {
  const includeExpense =
    showExpense ?? data.some((point) => (point.expense ?? 0) > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="analytics-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c400" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#f5c400" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === "expense" ? "Expense" : "Revenue",
          ]}
          labelStyle={{ fontWeight: 600, color: "#1a1d21" }}
          contentStyle={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            fontSize: 12,
            boxShadow: "0 8px 24px rgba(16,24,32,0.08)",
          }}
        />
        {includeExpense ? (
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
          />
        ) : null}
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#1a1d21"
          strokeWidth={2.25}
          fill="url(#analytics-revenue-fill)"
          activeDot={{ r: 5, fill: "#f5c400", stroke: "#1a1d21", strokeWidth: 2 }}
        />
        {includeExpense ? (
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#dc2626", stroke: "#fff", strokeWidth: 2 }}
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
