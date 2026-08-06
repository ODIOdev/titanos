import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { DataTable } from "@/components/admin/data-table";
import type { AdminOrder } from "@/lib/data/admin";
import {
  nextOrderActionLabel,
  orderNeedsAttention,
} from "@/lib/admin/orders-workflow";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function itemCount(order: AdminOrder) {
  return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

function OrderCard({ order }: { order: AdminOrder }) {
  const nextLabel = nextOrderActionLabel(order.status);
  const attention = orderNeedsAttention(order.status);

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className={cn(
        "block rounded-sm border bg-white p-3 transition-colors",
        attention
          ? "border-titan-yellow/70 hover:border-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            {order.order_number}
          </p>
          <p className="mt-0.5 truncate text-xs text-medium-gray">{order.email}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-0.5 text-xs text-medium-gray">
          <p className="inline-flex items-center gap-1">
            <Package className="size-3" aria-hidden="true" />
            {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"}
          </p>
          <p className="tabular-nums">{formatDate(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-base font-semibold tabular-nums text-dark-charcoal">
            {formatCurrency(order.total)}
          </p>
          {nextLabel ? (
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-dark-charcoal">
              {nextLabel}
              <ChevronRight className="size-3" aria-hidden="true" />
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function OrdersQueue({
  orders,
  emptyMessage,
}: {
  orders: AdminOrder[];
  emptyMessage: string;
}) {
  return (
    <>
      {/* Mobile cards */}
      <div className="@5xl:hidden">
        {orders.length === 0 ? (
          <p className="rounded-sm border border-border-gray bg-white px-4 py-8 text-center text-sm text-medium-gray">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden @5xl:block">
        <DataTable
          columns={[
            { key: "number", header: "Order" },
            { key: "email", header: "Customer" },
            { key: "status", header: "Status" },
            { key: "items", header: "Items" },
            { key: "total", header: "Total" },
            { key: "date", header: "Date" },
            { key: "next", header: "Next" },
            { key: "actions", header: "", className: "text-right" },
          ]}
          emptyMessage={emptyMessage}
          rows={orders.map((o) => {
            const nextLabel = nextOrderActionLabel(o.status);
            return [
              <Link
                key={`${o.id}-num`}
                href={`/admin/orders/${o.id}`}
                className="font-medium hover:text-titan-yellow"
              >
                {o.order_number}
              </Link>,
              <span key={`${o.id}-email`} className="text-sm">
                {o.email}
              </span>,
              <OrderStatusBadge key={`${o.id}-status`} status={o.status} />,
              <span key={`${o.id}-items`} className="tabular-nums text-sm">
                {itemCount(o)}
              </span>,
              <span key={`${o.id}-total`} className="tabular-nums font-medium">
                {formatCurrency(o.total)}
              </span>,
              <span key={`${o.id}-date`} className="text-sm text-medium-gray">
                {formatDate(o.created_at)}
              </span>,
              <span
                key={`${o.id}-next`}
                className="text-xs font-semibold uppercase tracking-wide text-medium-gray"
              >
                {nextLabel ?? "—"}
              </span>,
              <div key={`${o.id}-actions`} className="text-right">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="inline-flex h-8 items-center rounded-sm border border-border-gray px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
                >
                  Open
                </Link>
              </div>,
            ];
          })}
        />
      </div>
    </>
  );
}
