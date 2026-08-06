import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Boxes,
  DollarSign,
  ImageIcon,
  Package,
  Plus,
  Tags,
} from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { CategoryProductRowActions } from "@/components/admin/category-product-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  categoryReturnKey,
  withAdminReturn,
} from "@/lib/admin/return-to";
import {
  formatCategorySku,
  resolveCategorySkuAbbreviation,
} from "@/lib/admin/category-sku";
import { getAdminCategoryDetail } from "@/lib/data/admin";
import { cn, formatCurrency } from "@/lib/utils";
import { CategorySkuPrefixEditor } from "@/components/admin/category-sku-prefix-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  fill,
  iconTone,
  barTone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Package;
  fill: number;
  iconTone: string;
  barTone: string;
}) {
  const width =
    fill <= 0 ? "0%" : `${Math.max(8, Math.min(100, fill))}%`;
  return (
    <div className="flex h-full min-w-0 flex-col justify-between rounded-sm border border-border-gray bg-light-gray/40 p-3 @5xl:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray @5xl:text-xs">
            {label}
          </p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-dark-charcoal @5xl:text-2xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[0.65rem] text-medium-gray @5xl:text-xs">
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-sm @5xl:size-9",
            iconTone,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={cn("h-full rounded-full", barTone)}
          style={{ width }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default async function AdminCategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getAdminCategoryDetail(id);
  if (!detail) notFound();

  const { category, products, brands } = detail;
  const imageUrl = category.image_url?.trim() || null;
  const skuAbbr = resolveCategorySkuAbbreviation(category);
  const skuPattern = formatCategorySku(skuAbbr, 0);

  const productFill = Math.min(100, detail.productCount * 8);
  const brandFill = Math.min(100, detail.brandCount * 18);
  const inventoryFill = Math.min(100, detail.totalInventory / 5);
  const salesFill = Math.min(100, detail.totalSales / 50);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden @5xl:space-y-6">
      <div className="flex flex-col gap-3 @5xl:flex-row @5xl:items-start @5xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal @5xl:text-2xl">
              {category.name}
            </h2>
            <span
              className="inline-flex items-center rounded-sm border border-border-gray bg-white px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-dark-charcoal @5xl:text-sm"
              title="Category SKU prefix — new products auto-sequence from this"
            >
              {skuPattern}
            </span>
          </div>
          <p className="mt-1 text-sm text-medium-gray">
            {category.description ?? "No description"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={category.active ? "success" : "default"}>
              {category.active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-medium-gray">
              Slug: {category.slug}
            </span>
            <CategorySkuPrefixEditor
              categoryId={category.id}
              prefix={skuAbbr}
              exampleSku={skuPattern}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 @5xl:flex @5xl:flex-wrap">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-sm border border-border-gray bg-white px-3 text-center font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray @5xl:px-4 @5xl:text-sm"
          >
            Edit category
          </Link>
          <Link
            href={`/shop/${category.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-sm border border-border-gray bg-white px-3 text-center font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray @5xl:px-4 @5xl:text-sm"
          >
            View storefront
          </Link>
          <Link
            href={withAdminReturn(
              "/admin/products/new",
              categoryReturnKey(category.id),
            )}
            className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-sm bg-titan-yellow px-3 text-center font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400] @5xl:col-span-1 @5xl:px-4 @5xl:text-sm"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add product
          </Link>
        </div>
      </div>

      <section
        className="overflow-hidden rounded-sm border border-border-gray bg-white"
        aria-label="Category overview"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-gray px-3 py-2.5 @5xl:px-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-sm">
            Overview
          </h3>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal"
          >
            Edit image & details
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 @5xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] @5xl:grid-rows-2 @5xl:gap-3 @5xl:p-4">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="group relative col-span-2 mx-auto aspect-square w-36 overflow-hidden rounded-sm border border-border-gray bg-light-gray @5xl:col-span-1 @5xl:row-span-2 @5xl:mx-0 @5xl:h-full @5xl:w-auto @5xl:min-w-[11rem]"
            aria-label="Edit category image"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${category.name} category image`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 64rem) 144px, 280px"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                <ImageIcon
                  className="size-5 text-medium-gray"
                  aria-hidden="true"
                />
                <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-medium-gray">
                  Add image
                </span>
              </div>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-dark-charcoal/75 py-1 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </Link>

          <StatTile
            label="Products"
            value={String(detail.productCount)}
            hint="In this category"
            icon={Package}
            fill={productFill}
            iconTone="bg-blue-100 text-blue-800"
            barTone="bg-blue-500"
          />
          <StatTile
            label="Brands"
            value={String(detail.brandCount)}
            hint="Linked makers"
            icon={Tags}
            fill={brandFill}
            iconTone="bg-amber-100 text-amber-900"
            barTone="bg-amber-500"
          />
          <StatTile
            label="Inventory"
            value={String(detail.totalInventory)}
            hint="Units on hand"
            icon={Boxes}
            fill={inventoryFill}
            iconTone="bg-teal-100 text-teal-900"
            barTone="bg-teal-500"
          />
          <StatTile
            label="Sales"
            value={formatCurrency(detail.totalSales)}
            hint={`${detail.totalUnitsSold} units sold`}
            icon={DollarSign}
            fill={salesFill}
            iconTone="bg-emerald-100 text-emerald-900"
            barTone="bg-emerald-500"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-base uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
          Brands in this category
        </h3>
        {brands.length === 0 ? (
          <p className="rounded-sm border border-border-gray bg-white px-4 py-6 text-sm text-medium-gray">
            No brands linked to products in this category yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 @5xl:grid-cols-3 @5xl:gap-3">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-sm border border-border-gray bg-white px-3 py-2.5 @5xl:px-4 @5xl:py-3"
              >
                <p className="truncate font-medium text-dark-charcoal">
                  {brand.name}
                </p>
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
        <h3 className="font-heading text-base uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
          Products
        </h3>

        <ul className="divide-y divide-border-gray overflow-hidden rounded-sm border border-border-gray bg-white @5xl:hidden">
          {products.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-medium-gray">
              No products in this category.
            </li>
          ) : (
            products.map((p) => {
              const low = p.inventory <= p.lowStockThreshold;
              return (
                <li key={p.id} className="px-3 py-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Link
                      href={withAdminReturn(
                        `/admin/products/${p.id}`,
                        categoryReturnKey(category.id),
                      )}
                      className="min-w-0 flex-1 active:opacity-80"
                    >
                      <span className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-dark-charcoal">
                          {p.name}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-dark-charcoal">
                          {formatCurrency(p.price)}
                        </span>
                      </span>
                      <span className="mt-1 flex min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[0.65rem] text-medium-gray">
                          {p.sku}
                          {p.brandName ? ` · ${p.brandName}` : ""}
                          {" · "}
                          <span
                            className={
                              low
                                ? "font-semibold text-warning-orange"
                                : undefined
                            }
                          >
                            {p.inventory} stock
                          </span>
                          {p.stockBySize ? (
                            <span className="block truncate text-[0.6rem] text-medium-gray">
                              {p.stockBySize}
                            </span>
                          ) : null}
                        </span>
                        <Badge
                          variant={p.active ? "success" : "default"}
                          className="shrink-0"
                        >
                          {p.active ? "Active" : "Archived"}
                        </Badge>
                      </span>
                    </Link>
                    <CategoryProductRowActions
                      productId={p.id}
                      productName={p.name}
                      categoryId={category.id}
                    />
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="hidden @5xl:block">
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
              {
                key: "actions",
                header: "Actions",
                className: "text-right",
              },
            ]}
            emptyMessage="No products in this category."
            rowHrefs={products.map((p) =>
              withAdminReturn(
                `/admin/products/${p.id}`,
                categoryReturnKey(category.id),
              ),
            )}
            rows={products.map((p) => {
              const low = p.inventory <= p.lowStockThreshold;
              return [
                <span
                  key={`${p.id}-name`}
                  className="font-medium text-dark-charcoal"
                >
                  {p.name}
                </span>,
                <span key={`${p.id}-brand`}>{p.brandName}</span>,
                <span key={`${p.id}-sku`} className="text-medium-gray">
                  {p.sku}
                </span>,
                <span key={`${p.id}-price`}>{formatCurrency(p.price)}</span>,
                <span
                  key={`${p.id}-inv`}
                  className={low ? "font-semibold text-warning-orange" : undefined}
                >
                  <span className="tabular-nums">{p.inventory}</span>
                  {p.stockBySize ? (
                    <span className="mt-0.5 block max-w-[12rem] truncate text-[11px] font-normal text-medium-gray">
                      {p.stockBySize}
                    </span>
                  ) : null}
                </span>,
                <span key={`${p.id}-units`}>{p.unitsSold}</span>,
                <span key={`${p.id}-sales`}>{formatCurrency(p.sales)}</span>,
                <Badge
                  key={`${p.id}-status`}
                  variant={p.active ? "success" : "default"}
                >
                  {p.active ? "Active" : "Archived"}
                </Badge>,
                <CategoryProductRowActions
                  key={`${p.id}-actions`}
                  productId={p.id}
                  productName={p.name}
                  categoryId={category.id}
                />,
              ];
            })}
          />
        </div>
      </section>
    </div>
  );
}
