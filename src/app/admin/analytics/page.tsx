import Link from "next/link";
import { Download } from "lucide-react";
import { MetricCard } from "@/components/admin/metric-card";
import { AnalyticsRevenueChart } from "@/components/admin/analytics-revenue-chart";
import { getAdminMetrics } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export default async function AdminAnalyticsPage() {
  const metrics = await getAdminMetrics();

  const categoryTotal = metrics.salesByCategory.reduce(
    (sum, row) => sum + row.sales,
    0,
  );
  const topProductTotal = metrics.topProducts.reduce(
    (sum, row) => sum + row.sales,
    0,
  );
  const unitsSold = metrics.topProducts.reduce(
    (sum, row) => sum + row.quantity,
    0,
  );
  const orderTotal = metrics.ordersByStatus.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const bestDay = metrics.revenueOverTime.reduce<
    { date: string; revenue: number } | null
  >((best, day) => (!best || day.revenue > best.revenue ? day : best), null);

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured() ? (
        <p className="rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-4 py-3 text-sm text-dark-charcoal">
          Demo mode — reports are derived from seed catalog data. Connect
          Supabase for live reporting.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Average order"
          value={formatCurrency(metrics.aov)}
          hint="Revenue per paid order"
        />
        <MetricCard
          label="Best day"
          value={bestDay ? formatCurrency(bestDay.revenue) : "—"}
          hint={bestDay ? bestDay.date : "No sales recorded"}
        />
      </div>

      <ReportCard
        title="Revenue over time"
        caption="Last 7 days of order revenue."
      >
        <div className="px-2 py-4 sm:px-4">
          <AnalyticsRevenueChart data={metrics.revenueOverTime} />
        </div>
      </ReportCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Sales by category"
          caption={`${formatCurrency(categoryTotal)} across ${metrics.salesByCategory.length} categories.`}
        >
          <ul className="divide-y divide-border-gray">
            {metrics.salesByCategory.map((row) => (
              <li key={row.category} className="px-4 py-3 sm:px-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-dark-charcoal">
                    {row.category}
                  </span>
                  <span className="shrink-0 text-sm text-medium-gray">
                    {formatCurrency(row.sales)} ·{" "}
                    {percent(row.sales, categoryTotal)}%
                  </span>
                </div>
                <ShareBar value={percent(row.sales, categoryTotal)} />
              </li>
            ))}
            {metrics.salesByCategory.length === 0 ? <EmptyRow /> : null}
          </ul>
        </ReportCard>

        <ReportCard
          title="Orders by status"
          caption={`${orderTotal} orders in the pipeline.`}
        >
          <ul className="divide-y divide-border-gray">
            {metrics.ordersByStatus.map((row) => (
              <li key={row.status} className="px-4 py-3 sm:px-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium capitalize text-dark-charcoal">
                    {row.status.replace(/_/g, " ")}
                  </span>
                  <span className="shrink-0 text-sm text-medium-gray">
                    {row.count} · {percent(row.count, orderTotal)}%
                  </span>
                </div>
                <ShareBar value={percent(row.count, orderTotal)} />
              </li>
            ))}
            {metrics.ordersByStatus.length === 0 ? <EmptyRow /> : null}
          </ul>
        </ReportCard>
      </div>

      <ReportCard
        title="Top products"
        caption={`${unitsSold} units sold across the best performers.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-border-gray bg-light-gray/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-medium-gray">
                <th className="px-4 py-2.5 sm:px-5">Product</th>
                <th className="px-4 py-2.5 text-right">Units</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 pr-4 text-right sm:pr-5">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {metrics.topProducts.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-medium text-dark-charcoal sm:px-5">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-right text-medium-gray">
                    {row.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-dark-charcoal">
                    {formatCurrency(row.sales)}
                  </td>
                  <td className="px-4 py-3 pr-4 text-right text-medium-gray sm:pr-5">
                    {percent(row.sales, topProductTotal)}%
                  </td>
                </tr>
              ))}
              {metrics.topProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-medium-gray sm:px-5"
                  >
                    No product sales recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </ReportCard>

      <ReportCard
        title="Exports"
        caption="Download catalog data for spreadsheets and reporting tools."
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
          <a
            href="/api/admin/products/export"
            className="inline-flex items-center gap-2 rounded-sm border border-border-gray bg-white px-3 py-2 text-sm font-semibold text-dark-charcoal transition-colors hover:border-dark-charcoal focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:outline-none"
          >
            <Download className="size-4" aria-hidden="true" />
            Product catalog CSV
          </a>
          <Link
            href="/admin/inventory"
            className="text-sm font-semibold text-medium-gray underline-offset-4 hover:text-dark-charcoal hover:underline"
          >
            Inventory report
          </Link>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-medium-gray underline-offset-4 hover:text-dark-charcoal hover:underline"
          >
            Orders & returns
          </Link>
        </div>
      </ReportCard>
    </div>
  );
}

function ReportCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="border-b border-border-gray px-4 py-4 sm:px-5">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
          {title}
        </h2>
        {caption ? (
          <p className="mt-1 text-sm text-medium-gray">{caption}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ShareBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-light-gray">
      <div
        className="h-full rounded-full bg-titan-yellow"
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
  );
}

function EmptyRow() {
  return (
    <li className="px-4 py-6 text-center text-sm text-medium-gray sm:px-5">
      Nothing to report yet.
    </li>
  );
}
