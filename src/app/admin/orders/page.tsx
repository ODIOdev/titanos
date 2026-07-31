import Link from "next/link";
import { AdminReturnsCard } from "@/components/admin/admin-returns-card";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminOrders, getAdminReturnsSummary } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ status?: string; q?: string }>;

const STATUSES = [
  "all",
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const [orders, returns] = await Promise.all([
    getAdminOrders({ status, q }),
    getAdminReturnsSummary(),
  ]);

  function statusHref(s: string) {
    const query = new URLSearchParams();
    if (s !== "all") query.set("status", s);
    if (q.trim()) query.set("q", q.trim());
    const qs = query.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearchForm
          placeholder="Search order #, email, product…"
          defaultValue={q}
          hiddenFields={status !== "all" ? { status } : undefined}
          label="Search orders"
        />
      </div>

      <AdminReturnsCard summary={returns} />

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = status === s;
          return (
            <Link
              key={s}
              href={statusHref(s)}
              className={
                active
                  ? "inline-flex h-8 items-center rounded-sm bg-dark-charcoal px-3 text-xs font-semibold uppercase tracking-wide text-white"
                  : "inline-flex h-8 items-center rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray"
              }
            >
              {s.replace(/_/g, " ")}
            </Link>
          );
        })}
      </div>

      <DataTable
        columns={[
          { key: "number", header: "Order" },
          { key: "email", header: "Customer" },
          { key: "status", header: "Status" },
          { key: "total", header: "Total" },
          { key: "date", header: "Date" },
          { key: "actions", header: "", className: "text-right" },
        ]}
        emptyMessage={
          q.trim() ? `No orders match “${q.trim()}”.` : "No orders for this filter."
        }
        rows={orders.map((o) => [
          <Link
            key={`${o.id}-num`}
            href={`/admin/orders/${o.id}`}
            className="font-medium hover:text-titan-yellow"
          >
            {o.order_number}
          </Link>,
          <span key={`${o.id}-email`}>{o.email}</span>,
          <Badge key={`${o.id}-status`} variant="default">
            {o.status}
          </Badge>,
          <span key={`${o.id}-total`}>{formatCurrency(o.total)}</span>,
          <span key={`${o.id}-date`}>{formatDate(o.created_at)}</span>,
          <div key={`${o.id}-actions`} className="text-right">
            <Link
              href={`/admin/orders/${o.id}`}
              className="inline-flex h-8 items-center rounded-sm border border-border-gray px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
            >
              View
            </Link>
          </div>,
        ])}
      />
    </div>
  );
}
