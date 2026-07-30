import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminQuotes } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ status?: string }>;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const quotes = await getAdminQuotes({ status });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "submitted",
          "reviewing",
          "quoted",
          "accepted",
          "converted",
          "rejected",
        ].map((s) => {
          const active = status === s;
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/quotes" : `/admin/quotes?status=${s}`}
              className={
                active
                  ? "inline-flex h-8 items-center rounded-sm bg-dark-charcoal px-3 text-xs font-semibold uppercase tracking-wide text-white"
                  : "inline-flex h-8 items-center rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
              }
            >
              {s.replace(/_/g, " ")}
            </Link>
          );
        })}
      </div>

      <DataTable
        columns={[
          { key: "number", header: "Quote" },
          { key: "company", header: "Company" },
          { key: "contact", header: "Contact" },
          { key: "status", header: "Status" },
          { key: "total", header: "Total" },
          { key: "date", header: "Submitted" },
        ]}
        emptyMessage="No quotes found."
        rows={quotes.map((q) => [
          <Link
            key={`${q.id}-num`}
            href={`/admin/quotes/${q.id}`}
            className="font-medium hover:text-titan-yellow"
          >
            {q.quote_number}
          </Link>,
          <span key={`${q.id}-co`}>{q.company ?? "—"}</span>,
          <span key={`${q.id}-contact`}>{q.contact_name}</span>,
          <Badge key={`${q.id}-status`}>{q.status.replace(/_/g, " ")}</Badge>,
          <span key={`${q.id}-total`}>
            {q.total != null ? formatCurrency(q.total) : "—"}
          </span>,
          <span key={`${q.id}-date`}>{formatDate(q.created_at)}</span>,
        ])}
      />
    </div>
  );
}
