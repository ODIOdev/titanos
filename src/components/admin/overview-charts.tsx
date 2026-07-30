"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminMetrics } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#f5c400", "#101820", "#6b7280", "#15803d", "#f97316", "#374151"];

type OverviewChartsProps = {
  metrics: AdminMetrics;
};

export function OverviewCharts({ metrics }: OverviewChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Revenue over time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={metrics.revenueOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f5c400"
              strokeWidth={2}
              dot={{ fill: "#101820", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Orders by status">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={metrics.ordersByStatus}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(props) => {
                const status = String(props.name ?? "");
                const count = Number(props.value ?? 0);
                return `${status} (${count})`;
              }}
            >
              {metrics.ordersByStatus.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sales by category">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={metrics.salesByCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="sales" fill="#101820" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top products">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={metrics.topProducts} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="sales" fill="#f5c400" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border-gray bg-white p-4 sm:p-5">
      <h2 className="mb-4 font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
        {title}
      </h2>
      {children}
    </div>
  );
}
