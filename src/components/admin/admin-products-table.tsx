"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminProductPreviewDialog,
  type AdminProductPreview,
} from "@/components/admin/admin-product-preview-dialog";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { DataTable } from "@/components/admin/data-table";
import { ReplenishProductButton } from "@/components/admin/replenish-product-button";
import { Button } from "@/components/ui/button";
import {
  bulkArchiveProducts,
  bulkDeleteProducts,
  bulkRestoreProducts,
} from "@/lib/actions/admin";
import { cn, formatCurrency, type CatalogStatus } from "@/lib/utils";

export type AdminProductTableRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string | null;
  brandName: string | null;
  price: number;
  inventoryQuantity: number;
  lowStockThreshold: number;
  stockBySize: string | null;
  stockSizes?: { size: string; qty: number }[];
  status: CatalogStatus;
  imageUrl: string;
  shortDescription: string | null;
  editHref: string;
};

type TabId = "active" | "draft" | "archived";

function ProductStatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        status === "active" && "bg-emerald-100 text-emerald-800",
        status === "draft" && "bg-amber-100 text-amber-900",
        status === "archived" && "bg-slate-200 text-slate-700",
      )}
    >
      {status === "active" ? "Active" : status === "draft" ? "Draft" : "Archived"}
    </span>
  );
}

function stockStateOf(qty: number, threshold: number): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
}

function stockFillPercent(qty: number, threshold: number, state: string) {
  if (state === "out") return 0;
  if (threshold <= 0) return state === "ok" ? 100 : 35;
  const fullAt = Math.max(threshold * 3, threshold + 1);
  return Math.min(100, Math.round((qty / fullAt) * 100));
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="inline-flex cursor-pointer items-center justify-center">
      <span className="relative inline-flex size-4 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          aria-label={label}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "peer absolute inset-0 size-4 cursor-pointer appearance-none rounded-sm border border-border-gray bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
            (checked || indeterminate) &&
              "border-dark-charcoal bg-dark-charcoal",
          )}
        />
        {(checked || indeterminate) && (
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute inset-0 m-auto size-3 text-white"
            aria-hidden
          >
            {indeterminate && !checked ? (
              <path
                d="M3.5 8h9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        )}
      </span>
    </label>
  );
}

export function AdminProductsTable({
  products,
  tab,
  emptyMessage,
  className,
}: {
  products: AdminProductTableRow[];
  tab: TabId;
  emptyMessage: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const pageIds = useMemo(() => products.map((p) => p.id), [products]);
  const selectedNames = useMemo(
    () => products.filter((p) => selected.has(p.id)).map((p) => p.name),
    [products, selected],
  );
  const previewProduct = useMemo((): AdminProductPreview | null => {
    const p = products.find((row) => row.id === previewId);
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      imageUrl: p.imageUrl,
      brandName: p.brandName,
      categoryName: p.categoryName,
      price: p.price,
      inventoryQuantity: p.inventoryQuantity,
      lowStockThreshold: p.lowStockThreshold,
      stockBySize: p.stockBySize,
      stockSizes: p.stockSizes,
      statusLabel:
        p.status === "active"
          ? "Active"
          : p.status === "draft"
            ? "Draft"
            : "Archived",
      statusVariant:
        p.status === "active"
          ? "success"
          : p.status === "draft"
            ? "warning"
            : "default",
      shortDescription: p.shortDescription,
      editHref: p.editHref,
      showReplenish: true,
    };
  }, [products, previewId]);

  useEffect(() => {
    setSelected(new Set());
    setDeleteOpen(false);
  }, [pageIds.join("|")]);

  const selectedCount = selected.size;
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected =
    pageIds.some((id) => selected.has(id)) && !allSelected;

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(pageIds) : new Set());
  }

  function runBulk(
    action: (ids: string[]) => Promise<{ success: boolean; message: string }>,
    opts?: { goToArchived?: boolean },
  ) {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await action(ids);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSelected(new Set());
      setDeleteOpen(false);
      if (opts?.goToArchived) {
        router.push("/admin/products?tab=archived");
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  const deleteLabel =
    selectedCount === 1
      ? (selectedNames[0] ?? "1 product")
      : `${selectedCount} products`;

  return (
    <div className={cn("relative", className)}>
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border-gray bg-light-gray px-4 py-3 sm:px-5">
          <p className="text-sm font-medium text-dark-charcoal">
            <span className="tabular-nums">{selectedCount}</span> selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {tab === "archived" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => runBulk(bulkRestoreProducts)}
              >
                {pending ? "…" : "Restore"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  runBulk(bulkArchiveProducts, { goToArchived: true })
                }
              >
                {pending ? "…" : "Archive"}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={deleteLabel}
        description="This permanently removes the selected products from the catalog. This cannot be undone."
        pending={pending}
        onConfirm={() => runBulk(bulkDeleteProducts)}
      />

      <DataTable
        className="rounded-none border-0"
        noHorizontalScroll
        emptyMessage={emptyMessage}
        onRowActivate={(index) => {
          const id = products[index]?.id;
          if (id) setPreviewId(id);
        }}
        columns={[
          {
            key: "select",
            header: (
              <SelectCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                label="Select all products on this page"
                onChange={toggleAll}
              />
            ),
            className: "w-10 pr-0",
          },
          { key: "name", header: "Product", className: "w-[26%]" },
          {
            key: "sku",
            header: "SKU",
            className: "w-[11%] overflow-visible",
          },
          {
            key: "category",
            header: "Category",
            className: "w-[12%] overflow-visible",
          },
          { key: "price", header: "Price", className: "w-[8%]" },
          { key: "stock", header: "On hand", className: "w-[16%]" },
          { key: "status", header: "Status", className: "w-[8%]" },
          {
            key: "actions",
            header: "Actions",
            className: "w-[19%] min-w-[11rem] overflow-visible text-right",
          },
        ]}
        rows={products.map((p) => {
          const stockState = stockStateOf(
            p.inventoryQuantity,
            p.lowStockThreshold,
          );
          const fill = stockFillPercent(
            p.inventoryQuantity,
            p.lowStockThreshold,
            stockState,
          );
          const isSelected = selected.has(p.id);
          return [
            <SelectCheckbox
              key={`${p.id}-select`}
              checked={isSelected}
              label={`Select ${p.name}`}
              onChange={(checked) => toggleOne(p.id, checked)}
            />,
            <div
              key={`${p.id}-name`}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                <Image
                  src={p.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={
                    p.imageUrl.startsWith("data:") ||
                    p.imageUrl.startsWith("blob:")
                  }
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-dark-charcoal">
                  {p.name}
                </p>
                <p className="truncate text-[11px] text-medium-gray">
                  {p.brandName ?? "No brand"}
                </p>
              </div>
            </div>,
            <span
              key={`${p.id}-sku`}
              className="block whitespace-normal break-all font-mono text-[11px] leading-snug text-dark-charcoal/80 line-clamp-2"
              title={p.sku || undefined}
            >
              {p.sku || "—"}
            </span>,
            <span
              key={`${p.id}-cat`}
              className="block whitespace-normal break-words text-xs leading-snug text-dark-charcoal/80 line-clamp-2"
              title={p.categoryName ?? undefined}
            >
              {p.categoryName ?? "—"}
            </span>,
            <span
              key={`${p.id}-price`}
              className="text-sm font-semibold tabular-nums text-dark-charcoal"
            >
              {formatCurrency(p.price)}
            </span>,
            <div key={`${p.id}-stock`} className="min-w-0 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex min-w-[2rem] items-center justify-center rounded-sm px-1.5 py-0.5 text-sm font-bold tabular-nums",
                    stockState === "out" && "bg-red-100 text-red-800",
                    stockState === "low" && "bg-amber-100 text-amber-900",
                    stockState === "ok" && "bg-emerald-100 text-emerald-900",
                  )}
                >
                  {p.inventoryQuantity}
                </span>
                <span className="text-[10px] tabular-nums text-medium-gray">
                  thr {p.lowStockThreshold}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-light-gray">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    stockState === "out" && "bg-red-500",
                    stockState === "low" && "bg-amber-500",
                    stockState === "ok" && "bg-emerald-500",
                  )}
                  style={{
                    width: `${Math.max(fill, stockState === "out" ? 0 : 4)}%`,
                  }}
                />
              </div>
              {p.stockSizes && p.stockSizes.length > 0 ? (
                <ul className="flex flex-wrap gap-1">
                  {p.stockSizes.map((row) => (
                    <li
                      key={`${p.id}-${row.size}`}
                      className="rounded-sm bg-light-gray px-1.5 py-0.5 text-[10px] tabular-nums text-dark-charcoal"
                    >
                      <span className="font-semibold">{row.size}</span>
                      <span className="text-medium-gray"> {row.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>,
            <ProductStatusBadge key={`${p.id}-status`} status={p.status} />,
            <div
              key={`${p.id}-actions`}
              className="flex w-full flex-row flex-nowrap items-center justify-end gap-1"
              data-no-row-nav
            >
              <Link
                href={p.editHref}
                className="inline-flex h-8 shrink-0 items-center rounded-sm border border-border-gray px-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-light-gray"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
              <div className="shrink-0">
                <ReplenishProductButton
                  productId={p.id}
                  productName={p.name}
                  currentQty={p.inventoryQuantity}
                />
              </div>
              {p.status !== "draft" ? (
                <div className="shrink-0">
                  <ArchiveProductButton
                    productId={p.id}
                    active={p.status === "active"}
                  />
                </div>
              ) : null}
            </div>,
          ];
        })}
      />

      <AdminProductPreviewDialog
        product={previewProduct}
        open={previewId != null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </div>
  );
}
