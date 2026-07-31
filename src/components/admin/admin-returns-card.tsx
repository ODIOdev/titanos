import Link from "next/link";
import { Ban, RotateCcw, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminReturnsSummary } from "@/lib/data/admin";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function Tile({
  label,
  value,
  hint,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: typeof Undo2;
  iconClass?: string;
}) {
  return (
    <div className="rounded-sm border border-border-gray bg-white p-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-sm",
              iconClass ?? "bg-light-gray text-dark-charcoal",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
          {label}
        </p>
      </div>
      <p className="mt-1 font-heading text-xl font-semibold tabular-nums leading-tight text-dark-charcoal">
        {value}
      </p>
      <p className="text-[11px] tabular-nums text-medium-gray">{hint}</p>
    </div>
  );
}

export function AdminReturnsCard({
  summary,
}: {
  summary: AdminReturnsSummary;
}) {
  const hasReturns = summary.recent.length > 0;

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-gray bg-light-gray/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-warning-orange/15 text-warning-orange">
            <Undo2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
              Returns
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Orders that came back as refunds, plus orders cancelled before
              they shipped.
            </p>
          </div>
        </div>
        <Link
          href="/admin/orders?status=refunded"
          className="inline-flex h-8 shrink-0 items-center rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray"
        >
          View all refunds
        </Link>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <Tile
          label="Refunded"
          value={String(summary.refundedCount)}
          hint={`${formatCurrency(summary.refundedTotal)} returned`}
          icon={Undo2}
          iconClass={
            summary.refundedCount > 0
              ? "bg-red-100 text-red-700"
              : "bg-light-gray text-medium-gray"
          }
        />
        <Tile
          label="Cancelled"
          value={String(summary.cancelledCount)}
          hint={`${formatCurrency(summary.cancelledTotal)} never shipped`}
          icon={Ban}
          iconClass={
            summary.cancelledCount > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-light-gray text-medium-gray"
          }
        />
        <Tile
          label="Return rate"
          value={`${summary.returnRate.toFixed(1)}%`}
          hint={`Of ${summary.fulfilledCount + summary.refundedCount} fulfilled orders`}
          icon={RotateCcw}
          iconClass="bg-light-gray text-dark-charcoal"
        />
      </div>

      {hasReturns ? (
        <ul className="divide-y divide-border-gray border-t border-border-gray">
          {summary.recent.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-light-gray/60"
              >
                <span className="font-medium text-dark-charcoal">
                  {order.order_number}
                </span>
                <Badge
                  variant={order.status === "refunded" ? "warning" : "default"}
                >
                  {order.status}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-medium-gray">
                  {order.email}
                </span>
                <span className="text-sm font-semibold tabular-nums text-dark-charcoal">
                  {formatCurrency(order.total)}
                </span>
                <span className="text-xs tabular-nums text-medium-gray">
                  {formatDate(order.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border-gray px-5 py-4 text-sm text-medium-gray">
          No returns or cancellations yet. Set an order to{" "}
          <span className="font-medium text-dark-charcoal">refunded</span> on its
          detail page to record a return.
        </p>
      )}
    </section>
  );
}
