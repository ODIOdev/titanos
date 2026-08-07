"use client";

import { useMemo, useState } from "react";
import {
  AdminProductPreviewDialog,
  type AdminProductPreview,
} from "@/components/admin/admin-product-preview-dialog";
import { DataTable } from "@/components/admin/data-table";
import { formatCurrency } from "@/lib/utils";

export type OrderLineItemRow = {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export function OrderLineItemsTable({
  items,
  previews,
}: {
  items: OrderLineItemRow[];
  /** Live catalog snapshots keyed by product id. */
  previews: Record<string, AdminProductPreview>;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!previewId) return null;
    if (previews[previewId]) return previews[previewId];

    const item = items.find(
      (row) => row.productId === previewId || row.id === previewId,
    );
    if (!item) return null;

    return {
      id: item.productId ?? item.id,
      name: item.productName,
      sku: item.sku,
      imageUrl: "/images/products/titan-premium-vented-hard-hat.svg",
      brandName: null,
      categoryName: null,
      price: item.unitPrice,
      inventoryQuantity: 1,
      lowStockThreshold: 0,
      stockBySize: null,
      statusLabel: "Order line",
      statusVariant: "default" as const,
      shortDescription: `Ordered qty ${item.quantity} · line total ${formatCurrency(item.totalPrice)}. Catalog product unavailable.`,
      editHref: item.productId
        ? `/admin/products/${item.productId}`
        : "/admin/products",
      showReplenish: false,
    } satisfies AdminProductPreview;
  }, [items, previewId, previews]);

  function openRow(index: number) {
    const item = items[index];
    if (!item) return;
    setPreviewId(item.productId ?? item.id);
  }

  return (
    <>
      <DataTable
        columns={[
          { key: "product", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "qty", header: "Qty" },
          { key: "unit", header: "Unit" },
          { key: "total", header: "Total" },
        ]}
        rows={items.map((item) => [
          <button
            key={`${item.id}-name`}
            type="button"
            className="max-w-full truncate text-left font-medium text-dark-charcoal underline-offset-2 hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewId(item.productId ?? item.id);
            }}
          >
            {item.productName}
          </button>,
          item.sku,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.totalPrice),
        ])}
        emptyMessage="No line items."
        onRowActivate={openRow}
      />

      <AdminProductPreviewDialog
        product={preview}
        open={previewId != null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
        size="sm"
      />
    </>
  );
}
