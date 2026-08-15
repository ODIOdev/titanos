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
  compact?: boolean;
};

export function AnalyticsRevenueChart({
  data,
  height = 280,
  showExpense,
  compact = false,
}: AnalyticsRevenueChartProps) {
  const includeExpense =
    showExpense ?? data.some((point) => (point.expense ?? 0) > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{
          top: compact ? 4 : 12,
          right: compact ? 4 : 12,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="analytics-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c400" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f5c400" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: compact ? 10 : 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          height={compact ? 22 : 30}
        />
        <YAxis
          tick={{ fontSize: compact ? 10 : 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={compact ? 56 : 72}
          tickFormatter={(value) => formatCurrency(Number(value))}
        />
        <Tooltip
          formatter={(value, name, item) => {
            const key = String(
              item?.dataKey ?? item?.payload?.dataKey ?? name ?? "",
            ).toLowerCase();
            const isExpense = key.includes("expense");
            return [
              formatCurrency(Number(value)),
              isExpense ? "Expense" : "Revenue",
            ];
          }}
          labelStyle={{ fontWeight: 600, color: "#1a1d21", fontSize: 11 }}
          contentStyle={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            fontSize: 11,
            boxShadow: "0 8px 24px rgba(16,24,32,0.08)",
            padding: "6px 10px",
          }}
        />
        {includeExpense ? (
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            wrapperStyle={{
              fontSize: compact ? 10 : 11,
              paddingBottom: compact ? 0 : 4,
            }}
          />
        ) : null}
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#1a1d21"
          strokeWidth={compact ? 1.75 : 2.25}
          fill="url(#analytics-revenue-fill)"
          activeDot={{
            r: compact ? 3.5 : 5,
            fill: "#f5c400",
            stroke: "#1a1d21",
            strokeWidth: 2,
          }}
        />
        {includeExpense ? (
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#dc2626"
            strokeWidth={compact ? 1.5 : 2}
            dot={false}
            activeDot={{
              r: compact ? 3 : 4,
              fill: "#dc2626",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
