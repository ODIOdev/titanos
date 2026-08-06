import Link from "next/link";
import Image from "next/image";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { BrandRowActions } from "@/components/admin/brand-row-actions";
import { BrandsArchivesCard } from "@/components/admin/brands-archives-card";
import { DataTable } from "@/components/admin/data-table";
import { Pagination } from "@/components/products/pagination";
import { Badge } from "@/components/ui/badge";
import { getAdminBrandRows } from "@/lib/data/admin";
import { matchesQuery } from "@/lib/search";

type SearchParams = Promise<{ q?: string; page?: string }>;

const PAGE_SIZE = 10;

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const requestedPage = Math.max(1, Number(params.page) || 1);

  let brands = await getAdminBrandRows();
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    brands = brands.filter(
      (b) =>
        matchesQuery(b.name, query) ||
        matchesQuery(b.slug, query) ||
        matchesQuery(b.description, query),
    );
  }

  const activeBrands = brands
    .filter((b) => b.active)
    .sort((a, b) => {
      // Brands with units on hand first, then zero-stock — A–Z within each group.
      const aHasStock = a.totalInventory > 0 ? 0 : 1;
      const bHasStock = b.totalInventory > 0 ? 0 : 1;
      if (aHasStock !== bHasStock) return aHasStock - bHasStock;
      return a.name.localeCompare(b.name);
    });
  const archivedBrands = brands
    .filter((b) => !b.active)
    .sort((a, b) => {
      const aHasStock = a.totalInventory > 0 ? 0 : 1;
      const bHasStock = b.totalInventory > 0 ? 0 : 1;
      if (aHasStock !== bHasStock) return aHasStock - bHasStock;
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.max(1, Math.ceil(activeBrands.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageBrands = activeBrands.slice(start, start + PAGE_SIZE);
  const rangeStart = activeBrands.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, activeBrands.length);

  return (
    <div className="space-y-4 @5xl:space-y-5">
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
              Active brands
            </h2>
            <p className="mt-0.5 text-xs text-medium-gray">
              {activeBrands.length === 0
                ? "No active brands"
                : `Showing ${rangeStart}–${rangeEnd} of ${activeBrands.length}`}
              {q.trim() ? ` matching “${q.trim()}”` : ""}
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            { key: "logo", header: "Logo" },
            { key: "name", header: "Brand" },
            { key: "products", header: "Products" },
            { key: "slug", header: "Slug" },
            { key: "status", header: "Status" },
            { key: "description", header: "Description" },
            { key: "actions", header: "Actions", className: "text-right" },
          ]}
          emptyMessage={
            q.trim()
              ? `No active brands match “${q.trim()}”.`
              : "No active brands. Assign a brand on a product to activate it, or add a new brand."
          }
          rowHrefs={pageBrands.map((b) => `/admin/brands/${b.id}`)}
          rows={pageBrands.map((b) => [
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
            <span
              key={`${b.id}-name`}
              className="font-medium text-dark-charcoal"
            >
              {b.name}
            </span>,
            <span
              key={`${b.id}-products`}
              className="tabular-nums font-medium text-dark-charcoal"
            >
              {b.productCount}
            </span>,
            <span key={`${b.id}-slug`} className="text-medium-gray">
              {b.slug}
            </span>,
            <Badge key={`${b.id}-status`} variant="success">
              Active
            </Badge>,
            <span
              key={`${b.id}-desc`}
              className="line-clamp-2 text-medium-gray"
            >
              {b.description ?? "—"}
            </span>,
            <BrandRowActions
              key={`${b.id}-actions`}
              brandId={b.id}
              brandName={b.name}
            />,
          ])}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/brands"
          searchParams={{ q: q.trim() || undefined }}
        />
      </section>

      <BrandsArchivesCard brands={archivedBrands} />
    </div>
  );
}
