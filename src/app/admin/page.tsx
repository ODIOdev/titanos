import Link from "next/link";
import {
  Ban,
  Boxes,
  ClipboardList,
  DollarSign,
  PackageX,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardRevenueOverTime } from "@/components/admin/dashboard-revenue-over-time";
import { OrderStatusDonut } from "@/components/admin/dashboard-charts";
import {
  CategorySalesBreakdown,
  TopProductsBreakdown,
} from "@/components/admin/dashboard-breakdown";
import { DashboardMobileOverview } from "@/components/admin/dashboard-mobile-overview";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getSuppliesInventory } from "@/lib/actions/supplies-inventory";
import { suppliesTotals } from "@/lib/admin/supplies-inventory";
import { statusColor } from "@/lib/admin/order-status-colors";
import {
  buildRevenueByRange,
  getAdminInventory,
  getAdminMetrics,
  getAdminOrders,
  getAdminQuotes,
} from "@/lib/data/admin";
import { getWalletLedger } from "@/lib/data/wallet";
import {
  getProductStockQuantity,
  getProductStockState,
} from "@/lib/catalog/product-stock";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const OPEN_QUOTE_STATUSES = [
  "submitted",
  "reviewing",
  "information_requested",
  "quoted",
];

export default async function AdminOverviewPage() {
  const [metrics, orders, inventory, quotes, suppliesInventory, wallet] =
    await Promise.all([
      getAdminMetrics(),
      getAdminOrders(),
      getAdminInventory(),
      getAdminQuotes(),
      getSuppliesInventory(),
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

  const supplies = suppliesTotals(suppliesInventory);
  const recentOrders = orders.slice(0, 6);
  const lowStock = inventory
    .filter((p) => getProductStockState(p) !== "ok")
    .slice(0, 6);
  const openQuotes = quotes
    .filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    .slice(0, 6);

  const orderTotal = metrics.ordersByStatus.reduce((s, r) => s + r.count, 0);
  const openOrders = metrics.ordersByStatus
    .filter((r) => ["pending", "paid", "processing"].includes(r.status))
    .reduce((s, r) => s + r.count, 0);
  const cancelledOrders = metrics.ordersByStatus
    .filter((r) => r.status === "cancelled")
    .reduce((s, r) => s + r.count, 0);
  const bestDay = metrics.revenueOverTime.reduce<
    { date: string; revenue: number } | null
  >((best, day) => (!best || day.revenue > best.revenue ? day : best), null);

  const attention = [
    metrics.pendingQuotes > 0
      ? {
          kind: "quotes" as const,
          href: "/admin/quotes",
          label: "Open quotes",
          count: metrics.pendingQuotes,
          hint: "Waiting on a response",
          tone: "orange" as const,
        }
      : null,
    metrics.lowStockCount > 0
      ? {
          kind: "stock" as const,
          href: "/admin/inventory",
          label: "Low stock",
          count: metrics.lowStockCount,
          hint: "At or below threshold",
          tone: "red" as const,
        }
      : null,
    openOrders > 0
      ? {
          kind: "orders" as const,
          href: "/admin/orders",
          label: "Open orders",
          count: openOrders,
          hint: "Pending, paid, or processing",
          tone: "blue" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(metrics.revenue),
      hint: "Paid & fulfilled",
      href: "/admin/wallet",
    },
    {
      label: "Orders",
      value: String(metrics.ordersCount),
      hint: `${openOrders} still open`,
      href: "/admin/orders",
    },
    {
      label: "Avg order",
      value: formatCurrency(metrics.aov),
      hint: bestDay ? `Best ${bestDay.date}` : "No sales yet",
    },
    {
      label: "Users",
      value: String(metrics.customersCount),
      hint: "Registered",
      href: "/admin/users",
    },
  ];

  return (
    <>
      {!isSupabaseConfigured() ? (
        <p className="mb-5 rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-4 py-3 text-sm text-dark-charcoal lg:mb-6">
          Demo mode — metrics are derived from seed catalog data. Connect
          Supabase for live admin data.
        </p>
      ) : null}

      <DashboardMobileOverview
        attention={attention}
        kpis={kpis}
        recentOrders={recentOrders.map((order) => ({
          id: order.id,
          order_number: order.order_number,
          email: order.email,
          created_at: order.created_at,
          status: order.status,
          total: order.total,
        }))}
        lowStock={lowStock.map((product) => ({
          id: product.id,
          name: product.name,
          inventory_quantity: getProductStockQuantity(product),
        }))}
        openQuotes={openQuotes.map((quote) => ({
          id: quote.id,
          company: quote.company,
          contact_name: quote.contact_name,
          quote_number: quote.quote_number,
          status: quote.status,
        }))}
      />

      <div className="admin-desktop-overview hidden space-y-6 @5xl:block">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <DashboardStatCard
            label="Revenue"
            value={formatCurrency(metrics.revenue)}
            hint="Paid & fulfilled orders"
            icon={DollarSign}
            tone="green"
            href="/admin/wallet"
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
            label="Cancelled"
            value={String(cancelledOrders)}
            hint="Cancelled before fulfillment"
            icon={Ban}
            tone="red"
            href="/admin/orders?status=cancelled"
            alert={cancelledOrders > 0}
          />
          <DashboardStatCard
            label="Users"
            value={String(metrics.customersCount)}
            hint="Registered accounts"
            icon={Users}
            tone="charcoal"
            href="/admin/users"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DashboardRevenueOverTime
            seriesByRange={revenueByRange}
            className="lg:col-span-2"
          />

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

        <section className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel
            title="Sales by category"
            caption="Revenue mix across the catalog"
          >
            <CategorySalesBreakdown data={metrics.salesByCategory} />
          </Panel>

          <Panel
            title="Top products"
            caption="Best performers by revenue"
            action={{ href: "/admin/products", label: "Catalog" }}
          >
            <TopProductsBreakdown data={metrics.topProducts} />
          </Panel>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
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
            label="Supplies"
            value={String(supplies.units)}
            hint={
              supplies.lowOut > 0
                ? `${supplies.lowOut} low / out · ${formatCurrency(supplies.value)}`
                : `${formatCurrency(supplies.value)} on hand`
            }
            icon={Boxes}
            tone="charcoal"
            href="/admin/inventory#supplies"
            alert={supplies.lowOut > 0}
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
                        {order.email}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.65rem] tabular-nums text-medium-gray">
                        Ordered {formatDateTime(order.created_at)}
                      </span>
                    </span>
                    <OrderStatusBadge status={order.status} />
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
                          getProductStockQuantity(product) <= 0
                            ? "text-sm font-semibold text-red-700"
                            : "text-sm font-semibold text-orange-700"
                        }
                      >
                        {getProductStockQuantity(product)}
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
    </>
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
      className={`min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border-gray px-3 py-3.5 sm:gap-3 sm:px-5">
        <div className="min-w-0">
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
