import Link from "next/link";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminQuotes } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const q = params.q ?? "";
  const quotes = await getAdminQuotes({ status, q });

  function statusHref(s: string) {
    const query = new URLSearchParams();
    if (s !== "all") query.set("status", s);
    if (q.trim()) query.set("q", q.trim());
    const qs = query.toString();
    return qs ? `/admin/quotes?${qs}` : "/admin/quotes";
  }

  return (
    <div className="space-y-4">
      <AdminSearchForm
        placeholder="Search quote #, company, contact…"
        defaultValue={q}
        hiddenFields={status !== "all" ? { status } : undefined}
        label="Search quotes"
      />

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
              href={statusHref(s)}
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
        emptyMessage={
          q.trim() ? `No quotes match “${q.trim()}”.` : "No quotes found."
        }
        rows={quotes.map((quote) => [
          <Link
            key={`${quote.id}-num`}
            href={`/admin/quotes/${quote.id}`}
            className="font-medium hover:text-titan-yellow"
          >
            {quote.quote_number}
          </Link>,
          <span key={`${quote.id}-co`}>{quote.company ?? "—"}</span>,
          <span key={`${quote.id}-contact`}>{quote.contact_name}</span>,
          <Badge key={`${quote.id}-status`}>
            {quote.status.replace(/_/g, " ")}
          </Badge>,
          <span key={`${quote.id}-total`}>
            {quote.total != null ? formatCurrency(quote.total) : "—"}
          </span>,
          <span key={`${quote.id}-date`}>{formatDate(quote.created_at)}</span>,
        ])}
      />
    </div>
  );
}
