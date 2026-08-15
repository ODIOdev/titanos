import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { statusColor } from "@/lib/admin/order-status-colors";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

export type DashboardRecentOrder = {
  id: string;
  order_number: string;
  email: string;
  created_at: string;
  status: string;
  total: number;
};

export function DashboardRecentOrders({
  orders,
  compact = false,
}: {
  orders: DashboardRecentOrder[];
  compact?: boolean;
}) {
  const total = orders.reduce((sum, order) => sum + Number(order.total), 0);

  if (orders.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-medium-gray">
        No orders yet.
      </p>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b border-border-gray bg-light-gray/35",
          compact ? "px-3 py-1.5" : "px-4 py-2 sm:px-5",
        )}
      >
        <p className="text-[10px] text-medium-gray">
          <span className="font-semibold text-dark-charcoal">{orders.length}</span>{" "}
          shown
        </p>
        <p className="text-[10px] text-medium-gray">
          <span className="font-heading font-semibold tabular-nums text-dark-charcoal">
            {formatCurrency(total)}
          </span>
        </p>
      </div>

      <ul className="divide-y divide-border-gray">
        {orders.map((order) => {
          const accent = statusColor(order.status);
          return (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className={cn(
                  "group relative flex items-center gap-2.5 transition-colors hover:bg-light-gray/70",
                  compact ? "px-3 py-2" : "gap-3 px-4 py-3.5 sm:px-5",
                )}
              >
                <span
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate font-heading text-xs font-semibold tracking-wide text-dark-charcoal">
                      {order.order_number}
                    </span>
                    <OrderStatusBadge
                      status={order.status}
                      className="scale-90 origin-left"
                    />
                  </span>
                  <span className="mt-0.5 flex min-w-0 gap-x-1.5 text-[10px] text-medium-gray">
                    <span className="truncate">{order.email || "Guest"}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0 tabular-nums">
                      {formatDateTime(order.created_at)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-heading text-sm font-bold tabular-nums text-dark-charcoal">
                    {formatCurrency(order.total)}
                  </span>
                  <span className="mt-0.5 inline-flex items-center text-[9px] font-semibold uppercase tracking-wide text-medium-gray opacity-0 group-hover:opacity-100">
                    Open
                    <ChevronRight className="size-2.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
