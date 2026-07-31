"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statusColor } from "@/lib/admin/order-status-colors";
import { formatCurrency } from "@/lib/utils";

export function OrderStatusDonut({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={54}
          outerRadius={84}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((row, index) => (
            <Cell key={row.status} fill={statusColor(row.status, index)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} orders`, String(name)]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategorySalesBars({
  data,
}: {
  data: { category: string; sales: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 180)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          width={120}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f4f4f5" }}
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Bar dataKey="sales" fill="#101820" radius={[0, 3, 3, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductsBars({
  data,
}: {
  data: { name: string; sales: number; quantity: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 180)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f4f4f5" }}
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Bar
          dataKey="sales"
          fill="#f5c400"
          radius={[0, 3, 3, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
