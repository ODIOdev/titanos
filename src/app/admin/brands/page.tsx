import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminBrands } from "@/lib/data/admin";

export default async function AdminBrandsPage() {
  const brands = await getAdminBrands();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Brand" },
        { key: "slug", header: "Slug" },
        { key: "status", header: "Status" },
        { key: "description", header: "Description" },
      ]}
      emptyMessage="No brands found."
      rows={brands.map((b) => [
        <span key={`${b.id}-name`} className="font-medium">
          {b.name}
        </span>,
        <span key={`${b.id}-slug`} className="text-medium-gray">
          {b.slug}
        </span>,
        <Badge key={`${b.id}-status`} variant={b.active ? "success" : "default"}>
          {b.active ? "Active" : "Inactive"}
        </Badge>,
        <span key={`${b.id}-desc`} className="line-clamp-2 text-medium-gray">
          {b.description ?? "—"}
        </span>,
      ])}
    />
  );
}
