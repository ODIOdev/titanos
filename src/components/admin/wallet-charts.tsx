"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { WalletCashFlowPoint } from "@/lib/admin/wallet";

export function WalletCashFlowChart({
  data,
}: {
  data: WalletCashFlowPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="wallet-income-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="wallet-expense-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
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
          tickFormatter={(v) => formatCurrency(Number(v))}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="#059669"
          strokeWidth={2}
          fill="url(#wallet-income-fill)"
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke="#dc2626"
          strokeWidth={2}
          fill="url(#wallet-expense-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
