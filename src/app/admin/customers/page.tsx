import { DataTable } from "@/components/admin/data-table";
import { getAdminCustomers } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "company", header: "Company" },
        { key: "orders", header: "Orders" },
        { key: "spent", header: "Total spent" },
        { key: "joined", header: "Joined" },
      ]}
      emptyMessage="No customers yet."
      rows={customers.map((c) => [
        <span key={`${c.id}-name`} className="font-medium">
          {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
        </span>,
        <span key={`${c.id}-email`}>{c.email}</span>,
        <span key={`${c.id}-co`}>{c.company ?? "—"}</span>,
        <span key={`${c.id}-orders`}>{c.orders_count}</span>,
        <span key={`${c.id}-spent`}>{formatCurrency(c.total_spent)}</span>,
        <span key={`${c.id}-joined`}>{formatDate(c.created_at)}</span>,
      ])}
    />
  );
}
