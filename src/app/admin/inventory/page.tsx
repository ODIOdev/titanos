import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminInventory } from "@/lib/data/admin";

export default async function AdminInventoryPage() {
  const products = await getAdminInventory();

  return (
    <div className="space-y-4">
      <p className="text-sm text-medium-gray">
        Rows at or below their low-stock threshold are highlighted.
      </p>
      <DataTable
        columns={[
          { key: "name", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "qty", header: "On hand" },
          { key: "threshold", header: "Threshold" },
          { key: "status", header: "Status" },
        ]}
        emptyMessage="No inventory records."
        rows={products.map((p) => {
          const low = p.inventory_quantity <= p.low_stock_threshold;
          return [
            <Link
              key={`${p.id}-name`}
              href={`/admin/products/${p.id}`}
              className={
                low
                  ? "font-semibold text-warning-orange hover:underline"
                  : "font-medium hover:text-titan-yellow"
              }
            >
              {p.name}
            </Link>,
            <span key={`${p.id}-sku`}>{p.sku}</span>,
            <span
              key={`${p.id}-qty`}
              className={low ? "font-semibold text-warning-orange" : undefined}
            >
              {p.inventory_quantity}
            </span>,
            <span key={`${p.id}-th`}>{p.low_stock_threshold}</span>,
            low ? (
              <Badge key={`${p.id}-st`} variant="warning">
                Low stock
              </Badge>
            ) : (
              <Badge key={`${p.id}-st`} variant="success">
                OK
              </Badge>
            ),
          ];
        })}
      />
    </div>
  );
}
