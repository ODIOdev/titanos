import Link from "next/link";
import { DashboardRevenueOverTime } from "@/components/admin/dashboard-revenue-over-time";
import {
  CategorySalesBreakdown,
  TopProductsBreakdown,
} from "@/components/admin/dashboard-breakdown";
import { DashboardMobileOverview } from "@/components/admin/dashboard-mobile-overview";
import { DashboardMetricRibbon } from "@/components/admin/dashboard-metric-ribbon";
import { DashboardOrderPipeline } from "@/components/admin/dashboard-order-pipeline";
import { DashboardRecentOrders } from "@/components/admin/dashboard-recent-orders";
import { getSuppliesInventory } from "@/lib/actions/supplies-inventory";
import { suppliesTotals } from "@/lib/admin/supplies-inventory";
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
import { cn, formatCurrency } from "@/lib/utils";
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
  const recentOrders = orders.slice(0, 5);
  const lowStock = inventory
    .filter((p) => getProductStockState(p) !== "ok")
    .slice(0, 5);
  const openQuotes = quotes
    .filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
    .slice(0, 5);

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
      hint: `${openOrders} open`,
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
        <p className="mb-3 rounded-sm border border-titan-yellow/40 bg-titan-yellow/10 px-3 py-2 text-xs text-dark-charcoal">
          Demo mode — seed metrics. Connect Supabase for live data.
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

      <div className="admin-desktop-overview hidden space-y-3 @5xl:block">
        <DashboardMetricRibbon
          revenue={metrics.revenue}
          ordersCount={metrics.ordersCount}
          openOrders={openOrders}
          aov={metrics.aov}
          bestDayLabel={bestDay?.date ?? null}
          usersCount={metrics.customersCount}
          cancelledOrders={cancelledOrders}
          pendingQuotes={metrics.pendingQuotes}
          lowStockCount={metrics.lowStockCount}
          suppliesUnits={supplies.units}
          suppliesValue={supplies.value}
          suppliesAlert={supplies.lowOut > 0}
          skuCount={inventory.length}
        />

        {/* Pulse + pipeline */}
        <section className="grid gap-3 lg:grid-cols-12">
          <DashboardRevenueOverTime
            seriesByRange={revenueByRange}
            className="lg:col-span-8"
            compact
          />

          <Panel
            title="Pipeline"
            caption={`${orderTotal} orders`}
            action={{ href: "/admin/orders", label: "Orders" }}
            className="lg:col-span-4"
            dense
          >
            <DashboardOrderPipeline data={metrics.ordersByStatus} />
          </Panel>
        </section>

        {/* Mix + leaders */}
        <section className="grid gap-3 lg:grid-cols-2">
          <Panel title="Category mix" caption="Revenue share" dense>
            <CategorySalesBreakdown data={metrics.salesByCategory} compact />
          </Panel>
          <Panel
            title="Top products"
            caption="By revenue"
            action={{ href: "/admin/products", label: "Catalog" }}
            dense
          >
            <TopProductsBreakdown data={metrics.topProducts} compact />
          </Panel>
        </section>

        {/* Work queue */}
        <section className="grid gap-3 lg:grid-cols-12">
          <Panel
            title="Recent orders"
            caption="Latest 5"
            className="lg:col-span-7"
            action={{ href: "/admin/orders", label: "All" }}
            dense
          >
            <DashboardRecentOrders orders={recentOrders} compact />
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <Panel
              title="Restock"
              caption={`${lowStock.length} SKUs`}
              action={{ href: "/admin/inventory", label: "Stock" }}
              dense
            >
              <ul className="divide-y divide-border-gray">
                {lowStock.map((product) => {
                  const qty = getProductStockQuantity(product);
                  return (
                    <li key={product.id}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-light-gray/70"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs text-dark-charcoal">
                          {product.name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-bold tabular-nums",
                            qty <= 0 ? "text-red-700" : "text-orange-700",
                          )}
                        >
                          {qty}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {lowStock.length === 0 ? (
                  <EmptyRow>Stock looks healthy.</EmptyRow>
                ) : null}
              </ul>
            </Panel>

            <Panel
              title="Quotes"
              caption={`${openQuotes.length} open`}
              action={{ href: "/admin/quotes", label: "All" }}
              dense
            >
              <ul className="divide-y divide-border-gray">
                {openQuotes.map((quote) => (
                  <li key={quote.id}>
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-light-gray/70"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-dark-charcoal">
                          {quote.company ?? quote.contact_name}
                        </span>
                        <span className="block truncate text-[10px] text-medium-gray">
                          {quote.quote_number}
                        </span>
                      </span>
                      <span className="max-w-[4.5rem] shrink-0 truncate text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        {quote.status.replace(/_/g, " ")}
                      </span>
                    </Link>
                  </li>
                ))}
                {openQuotes.length === 0 ? (
                  <EmptyRow>No open quotes.</EmptyRow>
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
  dense = false,
}: {
  title: string;
  caption?: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b border-border-gray",
          dense ? "px-3 py-2" : "px-3 py-3.5 sm:px-5",
        )}
      >
        <div className="min-w-0">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
            {title}
          </h2>
          {caption ? (
            <p className="text-[10px] text-medium-gray">{caption}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-medium-gray transition-colors hover:text-dark-charcoal"
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
    <li className="px-3 py-4 text-center text-xs text-medium-gray">
      {children}
    </li>
  );
}
