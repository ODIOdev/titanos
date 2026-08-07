import Link from "next/link";
import { Ban, Percent, Plus, RotateCcw } from "lucide-react";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { OrdersPipeline } from "@/components/admin/orders-pipeline";
import { OrdersQueue } from "@/components/admin/orders-queue";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  getAdminOrders,
  getAdminReturnsSummary,
} from "@/lib/data/admin";
import { ORDER_PIPELINE } from "@/lib/admin/orders-workflow";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ status?: string; q?: string }>;

const EXTRA_FILTERS = [
  { id: "all", label: "All" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";

  const [allOrders, returns] = await Promise.all([
    getAdminOrders({ q }),
    getAdminReturnsSummary(),
  ]);

  const orders =
    status === "all" ? allOrders : allOrders.filter((o) => o.status === status);

  const counts: Record<string, number> = {};
  for (const stage of ORDER_PIPELINE) {
    counts[stage.statusParam] = 0;
  }
  counts.cancelled = 0;
  counts.refunded = 0;
  for (const order of allOrders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
  }

  function statusHref(s: string) {
    const query = new URLSearchParams();
    if (s !== "all") query.set("status", s);
    if (q.trim()) query.set("q", q.trim());
    const qs = query.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  const queueTitle =
    status === "all"
      ? "All orders"
      : status === "refunded"
        ? "Returns queue"
        : status === "cancelled"
          ? "Cancelled orders"
          : `${status} queue`;

  return (
    <div className="space-y-5 @5xl:space-y-6">
      <div className="flex flex-col gap-3 @5xl:flex-row @5xl:items-center @5xl:justify-between">
        <AdminSearchForm
          placeholder="Search order #, email, product…"
          defaultValue={q}
          hiddenFields={status !== "all" ? { status } : undefined}
          label="Search orders"
        />
        <Link
          href="/admin/orders/new"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-titan-yellow px-4 text-sm font-semibold uppercase tracking-wide text-dark-charcoal transition-colors hover:bg-[#e0b400]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Create order
        </Link>
      </div>

      <OrdersPipeline
        counts={counts}
        activeStatus={status}
        searchQuery={q}
        returnCount={counts.refunded ?? returns.refundedCount}
      />

      {/* Returns / cancel snapshot */}
      <section
        className="grid gap-2 @3xl:grid-cols-3"
        aria-label="Returns and cancellations"
      >
        <Link
          href={statusHref("refunded")}
          className={cn(
            "rounded-sm border bg-white p-3 transition-colors",
            status === "refunded"
              ? "border-titan-yellow ring-1 ring-titan-yellow"
              : "border-border-gray hover:border-dark-charcoal/30",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-sm bg-[#fde0cc] text-[#c2410c]">
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </span>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              Refunded
            </p>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
            {returns.refundedCount}
          </p>
          <p className="text-xs tabular-nums text-medium-gray">
            {formatCurrency(returns.refundedTotal)} returned
          </p>
        </Link>
        <Link
          href={statusHref("cancelled")}
          className={cn(
            "rounded-sm border bg-white p-3 transition-colors",
            status === "cancelled"
              ? "border-titan-yellow ring-1 ring-titan-yellow"
              : "border-border-gray hover:border-dark-charcoal/30",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-sm bg-amber-100 text-amber-800">
              <Ban className="size-3.5" aria-hidden="true" />
            </span>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              Cancelled
            </p>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
            {returns.cancelledCount}
          </p>
          <p className="text-xs tabular-nums text-medium-gray">
            {formatCurrency(returns.cancelledTotal)} never shipped
          </p>
        </Link>
        <div
          className={cn(
            "relative overflow-hidden rounded-sm border border-[#f0c4a8] p-3",
            "bg-[linear-gradient(160deg,#fff6ef_0%,#ffffff_55%,#ffeee3_100%)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 120% at 100% 0%, rgba(232,120,72,0.14), transparent 55%)",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#fde0cc] text-[#c2410c] ring-4 ring-[#fff1e6]">
                  <Percent className="size-3.5" aria-hidden="true" />
                </span>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                  Return rate
                </p>
              </div>
              <span className="rounded-sm bg-white/85 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#c2410c]/90">
                Fulfilled
              </span>
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
              {returns.returnRate.toFixed(1)}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ffe8d6]">
              <div
                className="h-full rounded-full bg-[#e86f3a] transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, returns.returnRate))}%`,
                }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1.5 text-xs text-medium-gray">
              Of {returns.fulfilledCount + returns.refundedCount} fulfilled
              orders
            </p>
          </div>
        </div>
      </section>

      {returns.recent.length > 0 &&
      (status === "all" || status === "refunded" || status === "cancelled") ? (
        <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-border-gray px-3 py-2.5 @5xl:px-4">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-sm">
              Recent returns & cancels
            </h3>
            <Link
              href="/admin/orders?status=refunded"
              className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal"
            >
              Refunds
            </Link>
          </div>
          <ul className="divide-y divide-border-gray">
            {returns.recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 transition-colors hover:bg-light-gray/60 @5xl:px-4"
                >
                  <span className="font-medium text-dark-charcoal">
                    {order.order_number}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <span className="min-w-0 flex-1 truncate text-xs text-medium-gray">
                    {order.email}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                  <span className="text-[0.65rem] tabular-nums text-medium-gray">
                    {formatDate(order.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {EXTRA_FILTERS.map((f) => {
          const active = status === f.id;
          return (
            <Link
              key={f.id}
              href={statusHref(f.id)}
              className={cn(
                "inline-flex h-8 items-center rounded-sm px-3 text-xs font-semibold uppercase tracking-wide",
                active
                  ? "bg-dark-charcoal text-white"
                  : "border border-border-gray bg-white text-dark-charcoal hover:bg-light-gray",
              )}
            >
              {f.label}
              {f.id !== "all" ? (
                <span className="ml-1.5 tabular-nums opacity-70">
                  {counts[f.id] ?? 0}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
              {queueTitle}
            </h3>
            <p className="mt-0.5 text-xs text-medium-gray">
              {orders.length} order{orders.length === 1 ? "" : "s"}
              {q.trim() ? ` matching “${q.trim()}”` : ""}
            </p>
          </div>
        </div>
        <OrdersQueue
          orders={orders}
          emptyMessage={
            q.trim()
              ? `No orders match “${q.trim()}”.`
              : "No orders for this filter."
          }
        />
      </section>
    </div>
  );
}
