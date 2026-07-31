import Link from "next/link";
import {
  ClipboardList,
  DollarSign,
  PackageX,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnalyticsRevenueChart } from "@/components/admin/analytics-revenue-chart";
import {
  CategorySalesBars,
  OrderStatusDonut,
  TopProductsBars,
} from "@/components/admin/dashboard-charts";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/admin/order-status-colors";
import {
  getAdminInventory,
  getAdminMetrics,
  getAdminOrders,
  getAdminQuotes,
} from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const OPEN_QUOTE_STATUSES = [
  "submitted",
  "reviewing",
  "information_requested",
  "quoted",
];

export default async function AdminOverviewPage() {
  const [metrics, orders, inventory, quotes] = await Promise.all([
    getAdminMetrics(),
    getAdminOrders(),
    getAdminInventory(),
    getAdminQuotes(),
  ]);

  const recentOrders = orders.slice(0, 6);
  const lowStock = inventory
    .filter((p) => p.inventory_quantity <= p.low_stock_threshold)
    .slice(0, 6);
  const openQuotes = quotes
    .filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    .slice(0, 6);

  const orderTotal = metrics.ordersByStatus.reduce((s, r) => s + r.count, 0);
  const openOrders = metrics.ordersByStatus
    .filter((r) => ["pending", "paid", "processing"].includes(r.status))
    .reduce((s, r) => s + r.count, 0);
  const bestDay = metrics.revenueOverTime.reduce<
    { date: string; revenue: number } | null
  >((best, day) => (!best || day.revenue > best.revenue ? day : best), null);

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured() ? (
        <p className="rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-4 py-3 text-sm text-dark-charcoal">
          Demo mode — metrics are derived from seed catalog data. Connect
          Supabase for live admin data.
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Revenue"
          value={formatCurrency(metrics.revenue)}
          hint="Paid & fulfilled orders"
          icon={DollarSign}
          tone="green"
        />
        <DashboardStatCard
          label="Orders"
          value={String(metrics.ordersCount)}
          hint={`${openOrders} still open`}
          icon={ShoppingBag}
          tone="blue"
          href="/admin/orders"
        />
        <DashboardStatCard
          label="Average order"
          value={formatCurrency(metrics.aov)}
          hint={bestDay ? `Best day ${bestDay.date}` : "No sales yet"}
          icon={TrendingUp}
          tone="yellow"
        />
        <DashboardStatCard
          label="Customers"
          value={String(metrics.customersCount)}
          hint="Registered accounts"
          icon={Users}
          tone="charcoal"
          href="/admin/customers"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Revenue over time"
          caption="Last 7 days"
          className="lg:col-span-2"
          action={{ href: "/admin/analytics", label: "Full reports" }}
        >
          <div className="px-2 py-4 sm:px-4">
            <AnalyticsRevenueChart data={metrics.revenueOverTime} />
          </div>
        </Panel>

        <Panel
          title="Orders by status"
          caption={`${orderTotal} orders total`}
          action={{ href: "/admin/orders", label: "Manage" }}
        >
          <div className="px-4 pt-4 sm:px-5">
            <OrderStatusDonut data={metrics.ordersByStatus} />
          </div>
          <ul className="space-y-1.5 px-4 pb-4 sm:px-5">
            {metrics.ordersByStatus.map((row, index) => (
              <li
                key={row.status}
                className="flex items-center gap-2 text-sm text-dark-charcoal"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: statusColor(row.status, index) }}
                  aria-hidden="true"
                />
                <span className="flex-1 capitalize">
                  {row.status.replace(/_/g, " ")}
                </span>
                <span className="text-medium-gray">{row.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sales by category" caption="Revenue mix across the catalog">
          <div className="px-2 py-4 sm:px-4">
            <CategorySalesBars data={metrics.salesByCategory} />
          </div>
        </Panel>

        <Panel
          title="Top products"
          caption="Best performers by revenue"
          action={{ href: "/admin/products", label: "Catalog" }}
        >
          <div className="px-2 py-4 sm:px-4">
            <TopProductsBars data={metrics.topProducts} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Open quotes"
          value={String(metrics.pendingQuotes)}
          hint="Waiting on a response"
          icon={ClipboardList}
          tone="orange"
          href="/admin/quotes"
          alert={metrics.pendingQuotes > 0}
        />
        <DashboardStatCard
          label="Low stock"
          value={String(metrics.lowStockCount)}
          hint="At or below threshold"
          icon={PackageX}
          tone="red"
          href="/admin/inventory"
          alert={metrics.lowStockCount > 0}
        />
        <DashboardStatCard
          label="Open orders"
          value={String(openOrders)}
          hint="Pending, paid, or processing"
          icon={Receipt}
          tone="blue"
          href="/admin/orders"
        />
        <DashboardStatCard
          label="Catalog size"
          value={String(inventory.length)}
          hint="Active SKUs"
          icon={ShoppingBag}
          tone="charcoal"
          href="/admin/products"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent orders"
          caption="Newest first"
          className="lg:col-span-2"
          action={{ href: "/admin/orders", label: "All orders" }}
        >
          <ul className="divide-y divide-border-gray">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-light-gray sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-dark-charcoal">
                      {order.order_number}
                    </span>
                    <span className="block truncate text-xs text-medium-gray">
                      {order.email} · {formatDate(order.created_at)}
                    </span>
                  </span>
                  <Badge variant="default">{order.status}</Badge>
                  <span className="w-24 text-right text-sm font-medium text-dark-charcoal">
                    {formatCurrency(order.total)}
                  </span>
                </Link>
              </li>
            ))}
            {recentOrders.length === 0 ? (
              <EmptyRow>No orders yet.</EmptyRow>
            ) : null}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Restock soon"
            caption="At or below threshold"
            action={{ href: "/admin/inventory", label: "Inventory" }}
          >
            <ul className="divide-y divide-border-gray">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-light-gray sm:px-5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-dark-charcoal">
                      {product.name}
                    </span>
                    <span
                      className={
                        product.inventory_quantity <= 0
                          ? "text-sm font-semibold text-red-700"
                          : "text-sm font-semibold text-orange-700"
                      }
                    >
                      {product.inventory_quantity}
                    </span>
                  </Link>
                </li>
              ))}
              {lowStock.length === 0 ? (
                <EmptyRow>Every SKU is above its threshold.</EmptyRow>
              ) : null}
            </ul>
          </Panel>

          <Panel
            title="Quotes to answer"
            caption="Open requests"
            action={{ href: "/admin/quotes", label: "Quotes" }}
          >
            <ul className="divide-y divide-border-gray">
              {openQuotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-light-gray sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-dark-charcoal">
                        {quote.company ?? quote.contact_name}
                      </span>
                      <span className="block truncate text-xs text-medium-gray">
                        {quote.quote_number}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-medium-gray">
                      {quote.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              ))}
              {openQuotes.length === 0 ? (
                <EmptyRow>No open quote requests.</EmptyRow>
              ) : null}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  caption,
  action,
  className,
  children,
}: {
  title: string;
  caption?: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-sm border border-border-gray bg-white ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-gray px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            {title}
          </h2>
          {caption ? (
            <p className="mt-0.5 text-xs text-medium-gray">{caption}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-medium-gray transition-colors hover:text-dark-charcoal"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-6 text-center text-sm text-medium-gray sm:px-5">
      {children}
    </li>
  );
}
