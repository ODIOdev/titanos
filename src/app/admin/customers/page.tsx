import Link from "next/link";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { DataTable } from "@/components/admin/data-table";
import { getAdminCustomers } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const customers = await getAdminCustomers({ q });

  return (
    <div className="space-y-4">
      <AdminSearchForm
        placeholder="Search name, email, company…"
        defaultValue={q}
        label="Search customers"
      />
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "company", header: "Company" },
          { key: "promo", header: "Promo code" },
          { key: "orders", header: "Orders" },
          { key: "spent", header: "Total spent" },
          { key: "joined", header: "Joined" },
        ]}
        emptyMessage={
          q.trim() ? `No customers match “${q.trim()}”.` : "No customers yet."
        }
        rows={customers.map((c) => {
          const name =
            [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
          return [
            <Link
              key={`${c.id}-name`}
              href={`/admin/customers/${c.id}`}
              className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
            >
              {name}
            </Link>,
            <Link
              key={`${c.id}-email`}
              href={`/admin/customers/${c.id}`}
              className="text-dark-charcoal underline-offset-2 hover:underline"
            >
              {c.email}
            </Link>,
            <span key={`${c.id}-co`}>{c.company ?? "—"}</span>,
            <span key={`${c.id}-promo`} className="font-mono text-xs">
              {c.promo_code ?? "—"}
            </span>,
            <span key={`${c.id}-orders`}>{c.orders_count}</span>,
            <span key={`${c.id}-spent`}>{formatCurrency(c.total_spent)}</span>,
            <span key={`${c.id}-joined`}>{formatDate(c.created_at)}</span>,
          ];
        })}
      />
    </div>
  );
}
