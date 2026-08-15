import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { DashboardRevenueOverTime } from "@/components/admin/dashboard-revenue-over-time";
import { buttonVariants } from "@/components/ui/button";
import { formatOrderStatus } from "@/lib/admin/orders-workflow";
import {
  buildRevenueByRange,
  getAdminMetrics,
  getAdminOrders,
} from "@/lib/data/admin";
import { getWalletLedger } from "@/lib/data/wallet";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

const STATUS_BAR: Record<string, string> = {
  pending: "bg-orange-400",
  paid: "bg-emerald-500",
  processing: "bg-sky-500",
  shipped: "bg-blue-500",
  delivered: "bg-teal-500",
  cancelled: "bg-zinc-400",
  refunded: "bg-red-500",
};

const CATEGORY_BARS = [
  "bg-dark-charcoal",
  "bg-titan-yellow",
  "bg-emerald-600",
  "bg-sky-600",
  "bg-orange-500",
  "bg-zinc-500",
];

export default async function AdminAnalyticsPage() {
  const [metrics, orders, wallet] = await Promise.all([
    getAdminMetrics(),
    getAdminOrders(),
    getWalletLedger("all"),
  ]);

  const expenseStamps = wallet.transactions
    .filter((txn) => txn.direction === "debit")
    .map((txn) => ({ at: txn.date, amount: txn.amount }));

  const revenueByRange = buildRevenueByRange(
    orders.map((order) => ({
      created_at: order.created_at,
      total: order.total,
      status: order.status,
    })),
    {
      expenses: expenseStamps,
      demoFill: expenseStamps.length === 0 && !isSupabaseConfigured(),
      totalRevenue: metrics.revenue,
    },
  );
  const pulseSeries = revenueByRange["7d"];

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
  const weekRevenue = pulseSeries.reduce((sum, day) => sum + day.revenue, 0);
  const bestDay = pulseSeries.reduce<
    { date: string; revenue: number } | null
  >((best, day) => (!best || day.revenue > best.revenue ? day : best), null);
  const openOrders = metrics.ordersByStatus
    .filter((row) =>
      ["pending", "paid", "processing", "shipped"].includes(row.status),
    )
    .reduce((sum, row) => sum + row.count, 0);

  const rankedCategories = [...metrics.salesByCategory].sort(
    (a, b) => b.sales - a.sales,
  );
  const rankedProducts = [...metrics.topProducts].sort(
    (a, b) => b.sales - a.sales,
  );

  return (
    <div className="space-y-5 @5xl:space-y-6">
      {!isSupabaseConfigured() ? (
        <p className="rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-4 py-3 text-sm text-dark-charcoal">
          Demo mode — reports are derived from seed catalog data. Connect
          Supabase for live reporting.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Performance · Catalog mix
          </p>
          <p className="mt-1 text-sm text-medium-gray">
            Revenue, order pipeline, and product winners — built for quick
            decisions, not spreadsheet archaeology.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/wallet"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Wallet className="size-3.5" aria-hidden="true" />
            Wallet
          </Link>
          <a
            href="/api/admin/products/export"
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </a>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 @5xl:grid-cols-6">
        <div className="relative overflow-hidden rounded-sm border-2 border-titan-yellow bg-dark-charcoal p-5 text-white shadow-[0_10px_28px_rgba(16,24,32,0.2)] @5xl:col-span-2 @5xl:p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-titan-yellow/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-titan-yellow">
                Revenue
              </p>
              <p className="mt-1 text-xs text-white/60">
                Paid &amp; fulfilled orders
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
          </div>
          <p className="relative mt-5 font-heading text-4xl font-bold tabular-nums tracking-tight text-titan-yellow @5xl:text-5xl">
            {formatCurrency(metrics.revenue)}
          </p>
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                7-day
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                {formatCurrency(weekRevenue)}
              </p>
            </div>
            <div className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                Best day
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-white">
                {bestDay ? formatCurrency(bestDay.revenue) : "—"}
              </p>
            </div>
          </div>
        </div>

        <KpiTile
          className="@5xl:col-span-1"
          label="Orders"
          value={String(metrics.ordersCount)}
          hint={`${openOrders} still open`}
          icon={ShoppingBag}
          href="/admin/orders"
          accent="bg-sky-100 text-sky-800"
        />
        <KpiTile
          className="@5xl:col-span-1"
          label="Avg order"
          value={formatCurrency(metrics.aov)}
          hint="Revenue per paid order"
          icon={ArrowUpRight}
          accent="bg-emerald-100 text-emerald-800"
        />
        <KpiTile
          className="@5xl:col-span-1"
          label="Customers"
          value={String(metrics.customersCount)}
          hint="Registered accounts"
          icon={Users}
          href="/admin/users"
          accent="bg-dark-charcoal/10 text-dark-charcoal"
        />
        <KpiTile
          className="@5xl:col-span-1"
          label="Units sold"
          value={String(unitsSold)}
          hint="Across top products"
          icon={Package}
          href="/admin/products"
          accent="bg-orange-100 text-orange-800"
        />
      </section>

      <DashboardRevenueOverTime
        seriesByRange={revenueByRange}
        title="Revenue pulse"
        actionHref="/admin/wallet"
        actionLabel="Open wallet"
        chartHeight={300}
      />

      <section className="grid gap-4 @5xl:grid-cols-5">
        <div className="overflow-hidden rounded-sm border border-border-gray bg-white @5xl:col-span-3">
          <div className="border-b border-border-gray px-4 py-3 @5xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Sales by category
            </h2>
            <p className="text-xs text-medium-gray">
              {formatCurrency(categoryTotal)} across{" "}
              {rankedCategories.length} categor
              {rankedCategories.length === 1 ? "y" : "ies"}
            </p>
          </div>
          {rankedCategories.length === 0 ? (
            <EmptyState message="No category sales recorded yet." />
          ) : (
            <ul className="divide-y divide-border-gray">
              {rankedCategories.map((row, index) => {
                const share = percent(row.sales, categoryTotal);
                return (
                  <li
                    key={row.category}
                    className="px-4 py-3.5 transition-colors hover:bg-light-gray/40 @5xl:px-5"
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-light-gray font-heading text-[11px] font-bold tabular-nums text-medium-gray">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-dark-charcoal">
                          {row.category}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-dark-charcoal">
                          {formatCurrency(row.sales)}
                        </p>
                        <p className="text-[11px] tabular-nums text-medium-gray">
                          {share}% of mix
                        </p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-border-gray/60">
                      <div
                        className={cn(
                          "h-full rounded-sm",
                          CATEGORY_BARS[index % CATEGORY_BARS.length],
                        )}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-sm border border-border-gray bg-white @5xl:col-span-2">
          <div className="border-b border-border-gray px-4 py-3 @5xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Order pipeline
            </h2>
            <p className="text-xs text-medium-gray">
              {orderTotal} order{orderTotal === 1 ? "" : "s"} by status
            </p>
          </div>
          {metrics.ordersByStatus.length === 0 ? (
            <EmptyState message="No orders in the pipeline." />
          ) : (
            <ul className="divide-y divide-border-gray">
              {metrics.ordersByStatus.map((row) => {
                const share = percent(row.count, orderTotal);
                return (
                  <li key={row.status}>
                    <Link
                      href={`/admin/orders?status=${encodeURIComponent(row.status)}`}
                      className="block px-4 py-3 transition-colors hover:bg-light-gray/50 @5xl:px-5"
                    >
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium capitalize text-dark-charcoal">
                          {formatOrderStatus(row.status)}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-medium-gray">
                          <span className="font-semibold text-dark-charcoal">
                            {row.count}
                          </span>{" "}
                          · {share}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-light-gray">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            STATUS_BAR[row.status] ?? "bg-dark-charcoal",
                          )}
                          style={{ width: `${Math.max(share, 2)}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="flex flex-col gap-2 border-b border-border-gray px-4 py-3 @5xl:flex-row @5xl:items-end @5xl:justify-between @5xl:px-5">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Top products
            </h2>
            <p className="text-xs text-medium-gray">
              {unitsSold} units · {formatCurrency(topProductTotal)} from ranked
              SKUs
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal"
          >
            Catalog
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {rankedProducts.length === 0 ? (
          <EmptyState message="No product sales recorded yet." />
        ) : (
          <ol className="divide-y divide-border-gray">
            {rankedProducts.map((row, index) => {
              const share = percent(row.sales, topProductTotal);
              const medal =
                index === 0
                  ? "bg-titan-yellow text-dark-charcoal"
                  : index === 1
                    ? "bg-zinc-200 text-dark-charcoal"
                    : index === 2
                      ? "bg-orange-100 text-orange-900"
                      : "bg-light-gray text-medium-gray";
              return (
                <li
                  key={row.name}
                  className="flex flex-col gap-3 px-4 py-3.5 @5xl:flex-row @5xl:items-center @5xl:gap-5 @5xl:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-sm font-heading text-xs font-bold tabular-nums",
                        medal,
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-dark-charcoal">
                        {row.name}
                      </p>
                      <p className="text-xs tabular-nums text-medium-gray">
                        {row.quantity} unit{row.quantity === 1 ? "" : "s"} sold
                      </p>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-3 @5xl:w-auto @5xl:min-w-[16rem] @5xl:grid-cols-[1fr_auto]">
                    <div className="@5xl:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        Revenue
                      </p>
                      <p className="font-heading text-base font-semibold tabular-nums text-dark-charcoal">
                        {formatCurrency(row.sales)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        Share
                      </p>
                      <p className="text-base font-semibold tabular-nums text-dark-charcoal">
                        {share}%
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-light-gray @5xl:max-w-[8rem] @5xl:flex-1">
                    <div
                      className="h-full rounded-full bg-titan-yellow"
                      style={{ width: `${Math.max(share, 3)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="grid gap-3 @5xl:grid-cols-4">
        <ExportCard
          href="/api/admin/products/export"
          external
          title="Product catalog"
          description="CSV of SKUs, pricing, and stock for spreadsheets."
          icon={Download}
          cta="Download"
        />
        <ExportCard
          href="/admin/inventory"
          title="Inventory"
          description="On-hand quantities, low stock, and supplies."
          icon={Warehouse}
          cta="Open"
        />
        <ExportCard
          href="/admin/orders"
          title="Orders & returns"
          description="Fulfillment pipeline and cancelled revenue."
          icon={ShoppingBag}
          cta="Open"
        />
        <ExportCard
          href="/admin/wallet"
          title="Wallet books"
          description="P&L, cash flow, and platform balance."
          icon={Wallet}
          cta="Open"
        />
      </section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  href?: string;
  accent: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-sm",
            accent,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal @5xl:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-medium-gray">{hint}</p>
    </>
  );

  const classes = cn(
    "block rounded-sm border border-border-gray bg-white p-4 @5xl:p-5",
    href &&
      "transition-colors hover:border-dark-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}

function ExportCard({
  href,
  title,
  description,
  icon: Icon,
  cta,
  external,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cta: string;
  external?: boolean;
}) {
  const className =
    "group flex h-full flex-col rounded-sm border border-border-gray bg-white p-4 transition-colors hover:border-dark-charcoal/35 @5xl:p-5";

  const content = (
    <>
      <span className="flex size-9 items-center justify-center rounded-sm bg-light-gray text-dark-charcoal transition-colors group-hover:bg-titan-yellow">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
        {title}
      </h3>
      <p className="mt-1 flex-1 text-xs text-medium-gray">{description}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
        {cta}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </p>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-medium-gray @5xl:px-5">
      {message}
    </p>
  );
}
