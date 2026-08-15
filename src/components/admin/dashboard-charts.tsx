"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { statusColor } from "@/lib/admin/order-status-colors";
import { formatOrderStatus } from "@/lib/admin/orders-workflow";

export function OrderStatusDonut({
  data,
  height = 210,
}: {
  data: { status: string; count: number }[];
  height?: number;
}) {
  const compact = height < 180;
  const outer = compact ? 52 : 84;
  const inner = compact ? 34 : 54;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={inner}
          outerRadius={outer}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((row, index) => (
            <Cell key={row.status} fill={statusColor(row.status, index)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${value} orders`,
            formatOrderStatus(String(name)),
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
  );
}
