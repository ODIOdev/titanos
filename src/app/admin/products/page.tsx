import Link from "next/link";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAdminProducts } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

type SearchParams = Promise<{ q?: string; active?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeFilter =
    params.active === "archived"
      ? "archived"
      : params.active === "all"
        ? "all"
        : "active";

  const products = await getAdminProducts({
    q: params.q,
    active: activeFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <form className="flex flex-1 flex-wrap gap-2" method="get">
          <div className="min-w-[200px] flex-1">
            <Input
              name="q"
              placeholder="Search name or SKU..."
              defaultValue={params.q ?? ""}
              aria-label="Search products"
            />
          </div>
          <select
            name="active"
            defaultValue={activeFilter}
            className="h-10 rounded-sm border border-border-gray bg-white px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-sm bg-dark-charcoal px-4 font-heading text-sm font-semibold uppercase tracking-wide text-white hover:bg-near-black"
          >
            Filter
          </button>
        </form>
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center justify-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-titan-yellow/90"
        >
          New product
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "category", header: "Category" },
          { key: "price", header: "Price" },
          { key: "stock", header: "Stock" },
          { key: "status", header: "Status" },
          { key: "actions", header: "Actions", className: "text-right" },
        ]}
        emptyMessage="No products match your filters."
        rows={products.map((p) => {
          const low = p.inventory_quantity <= p.low_stock_threshold;
          return [
            <div key="name">
              <Link
                href={`/admin/products/${p.id}`}
                className="font-medium text-dark-charcoal hover:text-titan-yellow"
              >
                {p.name}
              </Link>
            </div>,
            <span key="sku">{p.sku}</span>,
            <span key="cat">{p.category?.name ?? "-"}</span>,
            <span key="price">{formatCurrency(p.price)}</span>,
            <span
              key="stock"
              className={low ? "font-semibold text-warning-orange" : undefined}
            >
              {p.inventory_quantity}
            </span>,
            <Badge key="status" variant={p.active ? "success" : "default"}>
              {p.active ? "Active" : "Archived"}
            </Badge>,
            <div key="actions" className="flex justify-end gap-2">
              <Link
                href={`/admin/products/${p.id}`}
                className="inline-flex h-8 items-center rounded-sm border border-border-gray px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
              >
                Edit
              </Link>
              <ArchiveProductButton productId={p.id} active={p.active} />
            </div>,
          ];
        })}
      />
    </div>
  );
}
