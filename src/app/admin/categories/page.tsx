import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminCategories, getAdminCategoryDetail } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  const details = await Promise.all(
    categories.map(async (c) => {
      const detail = await getAdminCategoryDetail(c.id);
      return {
        category: c,
        productCount: detail?.productCount ?? 0,
        brandCount: detail?.brandCount ?? 0,
        inventory: detail?.totalInventory ?? 0,
        sales: detail?.totalSales ?? 0,
      };
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/categories/new"
          className="inline-flex h-10 items-center justify-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
        >
          Add new category
        </Link>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "products", header: "Products" },
          { key: "brands", header: "Brands" },
          { key: "inventory", header: "Inventory" },
          { key: "sales", header: "Sales" },
          { key: "status", header: "Status" },
          { key: "actions", header: "Actions", className: "text-right" },
        ]}
        emptyMessage="No categories found."
        rows={details.map(({ category: c, productCount, brandCount, inventory, sales }) => [
          <div key={`${c.id}-name`}>
            <Link
              href={`/admin/categories/${c.id}`}
              className="font-medium text-dark-charcoal hover:text-titan-yellow"
            >
              {c.name}
            </Link>
            <p className="text-xs text-medium-gray">{c.slug}</p>
          </div>,
          <span key={`${c.id}-products`}>{productCount}</span>,
          <span key={`${c.id}-brands`}>{brandCount}</span>,
          <span key={`${c.id}-inv`}>{inventory}</span>,
          <span key={`${c.id}-sales`}>{formatCurrency(sales)}</span>,
          <Badge key={`${c.id}-status`} variant={c.active ? "success" : "default"}>
            {c.active ? "Active" : "Inactive"}
          </Badge>,
          <div key={`${c.id}-actions`} className="flex justify-end">
            <Link
              href={`/admin/categories/${c.id}`}
              className="inline-flex h-8 items-center rounded-sm border border-border-gray px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
            >
              Details
            </Link>
          </div>,
        ])}
      />
    </div>
  );
}
