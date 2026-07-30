import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminResources } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminResourcesPage() {
  const resources = await getAdminResources();

  return (
    <DataTable
      columns={[
        { key: "title", header: "Title" },
        { key: "slug", header: "Slug" },
        { key: "status", header: "Status" },
        { key: "date", header: "Created" },
        { key: "excerpt", header: "Excerpt" },
      ]}
      emptyMessage="No resources yet."
      rows={resources.map((r) => [
        <span key={`${r.id}-title`} className="font-medium">
          {r.title}
        </span>,
        <span key={`${r.id}-slug`} className="text-medium-gray">
          {r.slug}
        </span>,
        <Badge key={`${r.id}-status`} variant={r.published ? "success" : "default"}>
          {r.published ? "Published" : "Draft"}
        </Badge>,
        <span key={`${r.id}-date`}>{formatDate(r.created_at)}</span>,
        <span key={`${r.id}-excerpt`} className="line-clamp-2 text-medium-gray">
          {r.excerpt ?? "—"}
        </span>,
      ])}
    />
  );
}
