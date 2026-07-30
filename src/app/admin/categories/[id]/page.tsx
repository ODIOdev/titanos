import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { getAdminCategoryDetail } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getAdminCategoryDetail(id);
  if (!detail) notFound();

  const { category, products, brands } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/categories"
            className="text-xs font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal"
          >
            ← Categories
          </Link>
          <h2 className="mt-2 font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
            {category.name}
          </h2>
          <p className="mt-1 text-sm text-medium-gray">
            {category.description ?? "No description"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={category.active ? "success" : "default"}>
              {category.active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-medium-gray">Slug: {category.slug}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/shop/${category.slug}`}
            className="inline-flex h-10 items-center rounded-sm border border-border-gray bg-white px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray"
          >
            View storefront
          </Link>
          <Link
            href="/admin/categories/new"
            className="inline-flex h-10 items-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
          >
            Add category
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={String(detail.productCount)} />
        <MetricCard label="Brands" value={String(detail.brandCount)} />
        <MetricCard
          label="Inventory"
          value={String(detail.totalInventory)}
          hint="Units on hand"
        />
        <MetricCard
          label="Sales"
          value={formatCurrency(detail.totalSales)}
          hint={`${detail.totalUnitsSold} units sold`}
        />
      </div>

      <section className="space-y-3">
        <h3 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
          Brands in this category
        </h3>
        {brands.length === 0 ? (
          <p className="rounded-sm border border-border-gray bg-white px-4 py-6 text-sm text-medium-gray">
            No brands linked to products in this category yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-sm border border-border-gray bg-white px-4 py-3"
              >
                <p className="font-medium text-dark-charcoal">{brand.name}</p>
                <p className="text-xs text-medium-gray">
                  {brand.productCount} product
                  {brand.productCount === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
          Products
        </h3>
        <DataTable
          columns={[
            { key: "product", header: "Product" },
            { key: "brand", header: "Brand" },
            { key: "sku", header: "SKU" },
            { key: "price", header: "Price" },
            { key: "inventory", header: "Inventory" },
            { key: "units", header: "Units sold" },
            { key: "sales", header: "Sales" },
            { key: "status", header: "Status" },
          ]}
          emptyMessage="No products in this category."
          rows={products.map((p) => {
            const low = p.inventory <= p.lowStockThreshold;
            return [
              <Link
                key={`${p.id}-name`}
                href={`/admin/products/${p.id}`}
                className="font-medium text-dark-charcoal hover:text-titan-yellow"
              >
                {p.name}
              </Link>,
              <span key={`${p.id}-brand`}>{p.brandName}</span>,
              <span key={`${p.id}-sku`} className="text-medium-gray">
                {p.sku}
              </span>,
              <span key={`${p.id}-price`}>{formatCurrency(p.price)}</span>,
              <span
                key={`${p.id}-inv`}
                className={low ? "font-semibold text-warning-orange" : undefined}
              >
                {p.inventory}
              </span>,
              <span key={`${p.id}-units`}>{p.unitsSold}</span>,
              <span key={`${p.id}-sales`}>{formatCurrency(p.sales)}</span>,
              <Badge
                key={`${p.id}-status`}
                variant={p.active ? "success" : "default"}
              >
                {p.active ? "Active" : "Archived"}
              </Badge>,
            ];
          })}
        />
      </section>
    </div>
  );
}
