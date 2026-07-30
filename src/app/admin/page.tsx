import { MetricCard } from "@/components/admin/metric-card";
import { OverviewCharts } from "@/components/admin/overview-charts";
import { getAdminMetrics } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function AdminOverviewPage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured() ? (
        <p className="rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-4 py-3 text-sm text-dark-charcoal">
          Demo mode — metrics are derived from seed catalog data. Connect Supabase for live
          admin data.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Revenue"
          value={formatCurrency(metrics.revenue)}
          hint="Paid & fulfilled orders"
        />
        <MetricCard
          label="Orders"
          value={String(metrics.ordersCount)}
          hint="All statuses"
        />
        <MetricCard
          label="Customers"
          value={String(metrics.customersCount)}
          hint="Registered accounts"
        />
        <MetricCard
          label="Pending quotes"
          value={String(metrics.pendingQuotes)}
          hint="Needs review"
        />
        <MetricCard
          label="Low stock"
          value={String(metrics.lowStockCount)}
          hint="At or below threshold"
          trend={metrics.lowStockCount > 0 ? "Attention" : undefined}
        />
        <MetricCard
          label="AOV"
          value={formatCurrency(metrics.aov)}
          hint="Average order value"
        />
      </div>

      <OverviewCharts metrics={metrics} />
    </div>
  );
}
