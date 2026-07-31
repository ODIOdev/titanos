"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statusColor } from "@/lib/admin/order-status-colors";

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
