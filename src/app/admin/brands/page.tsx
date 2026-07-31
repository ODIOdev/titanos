import Link from "next/link";
import Image from "next/image";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { BrandRowActions } from "@/components/admin/brand-row-actions";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminBrands } from "@/lib/data/admin";
import { matchesQuery } from "@/lib/search";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  let brands = await getAdminBrands();
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    brands = brands.filter(
      (b) =>
        matchesQuery(b.name, query) ||
        matchesQuery(b.slug, query) ||
        matchesQuery(b.description, query),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearchForm
          placeholder="Search brands…"
          defaultValue={q}
          label="Search brands"
        />
        <Link
          href="/admin/brands/new"
          className="inline-flex h-10 items-center justify-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
        >
          Add brand
        </Link>
      </div>
      <DataTable
        columns={[
          { key: "logo", header: "Logo" },
          { key: "name", header: "Brand" },
          { key: "slug", header: "Slug" },
          { key: "status", header: "Status" },
          { key: "description", header: "Description" },
          { key: "actions", header: "Actions", className: "text-right" },
        ]}
        emptyMessage={
          q.trim() ? `No brands match “${q.trim()}”.` : "No brands found."
        }
        rows={brands.map((b) => [
          <div
            key={`${b.id}-logo`}
            className="flex h-10 w-16 items-center justify-center rounded-sm border border-border-gray bg-white p-1"
          >
            {b.logo_url ? (
              <Image
                src={b.logo_url}
                alt=""
                width={56}
                height={32}
                unoptimized
                className="max-h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-medium-gray">—</span>
            )}
          </div>,
          <Link
            key={`${b.id}-name`}
            href={`/admin/brands/${b.id}/edit`}
            className="font-medium text-dark-charcoal hover:text-titan-yellow"
          >
            {b.name}
          </Link>,
          <span key={`${b.id}-slug`} className="text-medium-gray">
            {b.slug}
          </span>,
          <Badge key={`${b.id}-status`} variant={b.active ? "success" : "default"}>
            {b.active ? "Active" : "Inactive"}
          </Badge>,
          <span key={`${b.id}-desc`} className="line-clamp-2 text-medium-gray">
            {b.description ?? "—"}
          </span>,
          <BrandRowActions
            key={`${b.id}-actions`}
            brandId={b.id}
            brandName={b.name}
          />,
        ])}
      />
    </div>
  );
}
