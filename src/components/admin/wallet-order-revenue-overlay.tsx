"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Dialog } from "@/components/ui/dialog";
import type { WalletOrderMargin } from "@/lib/admin/wallet";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function moneySum(rows: WalletOrderMargin[], key: keyof WalletOrderMargin) {
  return Math.round(
    rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0) * 100,
  ) / 100;
}

export function WalletOrderRevenueOverlay({
  revenueTotal,
  orders,
}: {
  revenueTotal: number;
  orders: WalletOrderMargin[];
}) {
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    const revenue = moneySum(orders, "revenue");
    const cogs = moneySum(orders, "cogs");
    const margin = moneySum(orders, "margin");
    return {
      revenue,
      cogs,
      margin,
      marginPct:
        revenue > 0 ? Math.round((margin / revenue) * 1000) / 10 : null,
    };
  }, [orders]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-light-gray/60 @3xl:px-5"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-emerald-100 text-emerald-700">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-dark-charcoal">
            Order revenue
          </span>
          <span className="block text-xs text-medium-gray">
            {formatCurrency(revenueTotal)} from paid &amp; fulfilled sales
          </span>
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Order revenue"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"} · product sales with margin`}
        className="max-w-2xl"
      >
        <div className="mb-3 grid grid-cols-3 gap-2 rounded-sm border border-border-gray bg-light-gray/50 px-3 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
              Revenue
            </p>
            <p className="text-sm font-semibold tabular-nums text-dark-charcoal">
              {formatCurrency(totals.revenue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
              COGS
            </p>
            <p className="text-sm font-semibold tabular-nums text-dark-charcoal">
              {formatCurrency(totals.cogs)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
              Margin
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                totals.margin >= 0 ? "text-emerald-700" : "text-red-700",
              )}
            >
              {formatCurrency(totals.margin)}
              {totals.marginPct != null ? (
                <span className="ml-1 text-xs font-medium text-medium-gray">
                  ({totals.marginPct}%)
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-medium-gray">
            No recognized orders in this period.
          </p>
        ) : (
          <ul className="-mx-1 max-h-[min(55dvh,28rem)] space-y-2 overflow-y-auto px-1">
            {orders.map((order) => (
              <li key={order.orderId}>
                <Link
                  href={order.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm border border-border-gray bg-white px-3 py-2.5 transition-colors hover:border-dark-charcoal/30 hover:bg-light-gray/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-medium-gray">
                        {formatDate(order.date)}
                        {order.email ? ` · ${order.email}` : null}
                      </p>
                    </div>
                    <ExternalLink
                      className="mt-0.5 size-3.5 shrink-0 text-medium-gray"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-border-gray pt-2.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        Revenue
                      </p>
                      <p className="text-sm tabular-nums text-dark-charcoal">
                        {formatCurrency(order.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        COGS
                      </p>
                      <p className="text-sm tabular-nums text-dark-charcoal">
                        {formatCurrency(order.cogs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        Margin
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium tabular-nums",
                          order.margin >= 0
                            ? "text-emerald-700"
                            : "text-red-700",
                        )}
                      >
                        {formatCurrency(order.margin)}
                        {order.marginPct != null ? (
                          <span className="ml-1 text-xs font-normal text-medium-gray">
                            {order.marginPct}%
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
