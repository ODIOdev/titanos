import Link from "next/link";
import { statusColor } from "@/lib/admin/order-status-colors";
import {
  formatOrderStatus,
  ORDER_PIPELINE,
  orderNeedsAttention,
} from "@/lib/admin/orders-workflow";
import { cn } from "@/lib/utils";

const PIPELINE_ORDER = [
  ...ORDER_PIPELINE.map((s) => s.id as string),
  "cancelled",
  "refunded",
];

function sortStatuses(rows: { status: string; count: number }[]) {
  return [...rows].sort((a, b) => {
    const ai = PIPELINE_ORDER.indexOf(a.status);
    const bi = PIPELINE_ORDER.indexOf(b.status);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function DashboardOrderPipeline({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const rows = sortStatuses(data.filter((r) => r.count > 0));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const open = rows
    .filter((r) => orderNeedsAttention(r.status))
    .reduce((sum, r) => sum + r.count, 0);
  const done = rows
    .filter((r) => r.status === "delivered")
    .reduce((sum, r) => sum + r.count, 0);
  const blocked = rows
    .filter((r) => r.status === "cancelled" || r.status === "refunded")
    .reduce((sum, r) => sum + r.count, 0);

  if (total === 0) {
    return (
      <div className="px-3 py-8 text-center text-xs text-medium-gray">
        No orders in the pipeline yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="grid grid-cols-3 gap-1.5">
        <Metric
          label="Open"
          value={open}
          tone={open > 0 ? "text-orange-700" : "text-dark-charcoal"}
        />
        <Metric label="Delivered" value={done} tone="text-teal-800" />
        <Metric
          label="Closed out"
          value={blocked}
          tone="text-medium-gray"
        />
      </div>

      <div>
        <div
          className="flex h-2.5 overflow-hidden rounded-sm bg-light-gray"
          role="img"
          aria-label="Order status mix"
        >
          {rows.map((row, index) => {
            const pct = (row.count / total) * 100;
            return (
              <Link
                key={row.status}
                href={`/admin/orders?status=${encodeURIComponent(row.status)}`}
                title={`${formatOrderStatus(row.status)} · ${row.count}`}
                className="relative min-w-[3px] transition-opacity hover:opacity-80"
                style={{
                  width: `${pct}%`,
                  backgroundColor: statusColor(row.status, index),
                }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-medium-gray">
          {open > 0
            ? `${open} need attention · ${total} total`
            : `All clear · ${total} total`}
        </p>
      </div>

      <ul className="space-y-1.5">
        {rows.map((row, index) => {
          const pct = Math.round((row.count / total) * 100);
          const attention = orderNeedsAttention(row.status);
          return (
            <li key={row.status}>
              <Link
                href={`/admin/orders?status=${encodeURIComponent(row.status)}`}
                className="group block rounded-sm border border-border-gray bg-light-gray/30 px-2.5 py-2 transition-colors hover:border-dark-charcoal/25 hover:bg-white"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: statusColor(row.status, index),
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs font-medium capitalize",
                      attention
                        ? "text-dark-charcoal"
                        : "text-dark-charcoal/85",
                    )}
                  >
                    {formatOrderStatus(row.status)}
                  </span>
                  <span className="text-[10px] tabular-nums text-medium-gray">
                    {pct}%
                  </span>
                  <span
                    className={cn(
                      "min-w-[1.25rem] text-right text-sm font-bold tabular-nums",
                      attention ? "text-orange-700" : "text-dark-charcoal",
                    )}
                  >
                    {row.count}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white">
                  <span
                    className="block h-full rounded-full transition-[width] group-hover:brightness-95"
                    style={{
                      width: `${Math.max(pct, 4)}%`,
                      backgroundColor: statusColor(row.status, index),
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-sm border border-border-gray bg-light-gray/40 px-2 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </p>
      <p className={cn("font-heading text-lg font-bold tabular-nums leading-none", tone)}>
        {value}
      </p>
    </div>
  );
}
