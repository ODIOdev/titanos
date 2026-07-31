import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  CircleAlert,
  DollarSign,
  PackageCheck,
  TriangleAlert,
} from "lucide-react";
import { AdminInventoryFilterBar } from "@/components/admin/admin-inventory-filter-bar";
import { DataTable } from "@/components/admin/data-table";
import {
  InventoryCategoryCards,
  type InventoryCategoryStat,
  type InventoryStockState,
} from "@/components/admin/inventory-category-cards";
import { ReplenishProductButton } from "@/components/admin/replenish-product-button";
import { Pagination } from "@/components/products/pagination";
import { Badge } from "@/components/ui/badge";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminInventory,
} from "@/lib/data/admin";
import {
  INVENTORY_DEFAULT_SORT,
  parseInventorySort,
  type InventorySortOption,
} from "@/lib/admin/inventory-sort";
import { withAdminReturn } from "@/lib/admin/return-to";
import { productSearchScore } from "@/lib/search";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const FALLBACK_IMAGE = "/images/products/titan-premium-vented-hard-hat.svg";
const ITEMS_PER_PAGE = 30;
const UNCATEGORIZED = "uncategorized";

type StockFilter = "all" | "ok" | "low" | "out";
type SortOption = InventorySortOption;
type StockState = InventoryStockState;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  stock?: string;
  sort?: string;
  page?: string;
}>;

function parseStock(value: string | undefined): StockFilter {
  if (value === "ok" || value === "low" || value === "out") return value;
  return "all";
}

function stockState(p: Product): StockState {
  const qty = p.inventory_quantity ?? 0;
  if (qty <= 0) return "out";
  if (qty <= (p.low_stock_threshold ?? 0)) return "low";
  return "ok";
}

function stockValue(p: Product) {
  return Number(p.price ?? 0) * (p.inventory_quantity ?? 0);
}

function productImageUrl(p: Product) {
  return (
    p.image_url ??
    p.images?.find((img) => img.is_primary)?.url ??
    p.images?.[0]?.url ??
    FALLBACK_IMAGE
  );
}

function buildHref(opts: {
  q?: string;
  category?: string;
  brand?: string;
  stock?: StockFilter;
  sort?: SortOption;
}) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.category) params.set("category", opts.category);
  if (opts.brand) params.set("brand", opts.brand);
  if (opts.stock && opts.stock !== "all") params.set("stock", opts.stock);
  if (opts.sort && opts.sort !== INVENTORY_DEFAULT_SORT) {
    params.set("sort", opts.sort);
  }
  const qs = params.toString();
  return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
}

/**
 * Compact frosted-glass filter button. Styled unlike the solid white category
 * cards below so the page reads as "overview controls, then detail cards".
 */
function KpiCell({
  href,
  label,
  value,
  hint,
  icon: Icon,
  iconClass,
  tintClass,
  barClass,
  share,
  active,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: typeof Boxes;
  iconClass: string;
  tintClass: string;
  barClass: string;
  share?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative isolate overflow-hidden rounded-sm border px-3 py-2.5 backdrop-blur-md transition-all",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.05)]",
        "hover:-translate-y-px hover:bg-white/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_16px_rgba(16,24,40,0.1)]",
        "active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(16,24,40,0.08)]",
        active
          ? "border-titan-yellow bg-white/85 ring-1 ring-titan-yellow"
          : "border-white/70 bg-white/55",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b",
          tintClass,
        )}
        aria-hidden="true"
      />

      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset ring-white/60",
            iconClass,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
            {label}
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-heading text-xl font-semibold tabular-nums leading-tight text-dark-charcoal">
              {value}
            </span>
            {share != null ? (
              <span className="text-[11px] font-medium tabular-nums text-medium-gray">
                {Math.round(share)}%
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <p className="mt-1 truncate text-[11px] text-medium-gray">{hint}</p>

      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-black/5"
        aria-hidden="true"
      >
        <span
          className={cn("block h-full", barClass)}
          style={{
            width: `${Math.min(100, Math.max(0, share ?? 100))}%`,
          }}
        />
      </span>
    </Link>
  );
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const categoryId = params.category ?? "";
  const brandId = params.brand ?? "";
  const stock = parseStock(params.stock);
  const sort = parseInventorySort(params.sort);
  const requestedPage = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );

  const [products, categories, brands] = await Promise.all([
    getAdminInventory(),
    getAdminCategories(),
    getAdminBrands(),
  ]);

  const totals = products.reduce(
    (acc, p) => {
      const state = stockState(p);
      acc[state] += 1;
      acc.units += p.inventory_quantity ?? 0;
      acc.value += stockValue(p);
      return acc;
    },
    { ok: 0, low: 0, out: 0, units: 0, value: 0 },
  );

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const statsById = new Map<string, InventoryCategoryStat>();
  for (const p of products) {
    const id = p.category_id ?? UNCATEGORIZED;
    let stat = statsById.get(id);
    if (!stat) {
      stat = {
        id,
        name:
          id === UNCATEGORIZED
            ? "Uncategorized"
            : (p.category?.name ?? categoryNames.get(id) ?? "Category"),
        skuCount: 0,
        units: 0,
        value: 0,
        ok: 0,
        low: 0,
        out: 0,
        okUnits: 0,
        lowUnits: 0,
        products: [],
      };
      statsById.set(id, stat);
    }
    const state = stockState(p);
    const units = p.inventory_quantity ?? 0;
    stat.skuCount += 1;
    stat.units += units;
    stat.value += stockValue(p);
    stat[state] += 1;
    if (state === "ok") stat.okUnits += units;
    if (state === "low") stat.lowUnits += units;
    stat.products.push({
      id: p.id,
      name: p.name,
      sku: p.sku ?? null,
      brand: p.brand?.name ?? null,
      imageUrl: productImageUrl(p),
      quantity: units,
      threshold: p.low_stock_threshold ?? 0,
      value: stockValue(p),
      state,
    });
  }
  const categoryStats = [...statsById.values()].sort(
    (a, b) => b.skuCount - a.skuCount || a.name.localeCompare(b.name),
  );

  const skuShare = (count: number) =>
    products.length === 0 ? 0 : (count / products.length) * 100;

  const filtered = products
    .filter((p) => {
      if (categoryId) {
        const id = p.category_id ?? UNCATEGORIZED;
        if (id !== categoryId) return false;
      }
      if (brandId && p.brand_id !== brandId) return false;
      if (stock !== "all" && stockState(p) !== stock) return false;
      if (q.trim() && productSearchScore(p, q) <= 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "stock-desc") {
        return (
          (b.inventory_quantity ?? 0) - (a.inventory_quantity ?? 0) ||
          a.name.localeCompare(b.name)
        );
      }
      if (sort === "value-desc") {
        return stockValue(b) - stockValue(a) || a.name.localeCompare(b.name);
      }
      if (sort === "value-asc") {
        return stockValue(a) - stockValue(b) || a.name.localeCompare(b.name);
      }
      if (sort === "stock-asc") {
        return (
          (a.inventory_quantity ?? 0) - (b.inventory_quantity ?? 0) ||
          a.name.localeCompare(b.name)
        );
      }
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);
  const pageStart = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const rangeStart = filtered.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + ITEMS_PER_PAGE, filtered.length);

  const hasFilters = Boolean(
    q.trim() ||
      categoryId ||
      brandId ||
      stock !== "all" ||
      sort !== INVENTORY_DEFAULT_SORT,
  );
  const filterState = { q, category: categoryId, brand: brandId, stock, sort };
  const activeCategoryName =
    categoryId === UNCATEGORIZED
      ? "Uncategorized"
      : categoryId
        ? categoryNames.get(categoryId)
        : null;

  return (
    <div className="space-y-6">
      <section aria-labelledby="stock-health-heading">
        <h2 id="stock-health-heading" className="sr-only">
          Stock health
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCell
            href={buildHref({ ...filterState, stock: "all" })}
            label="In stock"
            value={String(totals.ok)}
            hint={`${totals.units.toLocaleString()} units on hand`}
            icon={PackageCheck}
            iconClass="bg-emerald-500/15 text-emerald-700"
            tintClass="from-emerald-500/10 to-transparent"
            barClass="bg-emerald-500"
            share={skuShare(totals.ok)}
            active={stock === "all"}
          />
          <KpiCell
            href={buildHref({ ...filterState, stock: "low" })}
            label="Low stock"
            value={String(totals.low)}
            hint="At or below threshold"
            icon={TriangleAlert}
            iconClass={
              totals.low > 0
                ? "bg-amber-500/15 text-amber-700"
                : "bg-black/5 text-medium-gray"
            }
            tintClass={
              totals.low > 0
                ? "from-amber-500/10 to-transparent"
                : "from-white/40 to-transparent"
            }
            barClass="bg-amber-500"
            share={skuShare(totals.low)}
            active={stock === "low"}
          />
          <KpiCell
            href={buildHref({ ...filterState, stock: "out" })}
            label="Out of stock"
            value={String(totals.out)}
            hint="Needs restocking now"
            icon={CircleAlert}
            iconClass={
              totals.out > 0
                ? "bg-red-500/15 text-red-700"
                : "bg-black/5 text-medium-gray"
            }
            tintClass={
              totals.out > 0
                ? "from-red-500/10 to-transparent"
                : "from-white/40 to-transparent"
            }
            barClass="bg-red-500"
            share={skuShare(totals.out)}
            active={stock === "out"}
          />
          <KpiCell
            href={buildHref({ ...filterState, sort: "value-desc" })}
            label="Stock value"
            value={formatCurrency(totals.value)}
            hint={
              products.length > 0
                ? `${formatCurrency(totals.value / products.length)} avg across ${products.length} SKUs`
                : "No SKUs yet"
            }
            icon={DollarSign}
            iconClass="bg-titan-yellow/25 text-dark-charcoal"
            tintClass="from-titan-yellow/12 to-transparent"
            barClass="bg-titan-yellow"
            active={sort === "value-desc"}
          />
        </div>
      </section>

      {categoryStats.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
              Stock by category
            </h2>
            <p className="text-sm text-medium-gray">
              Select a card to view its products.
            </p>
          </div>
          <div className="mt-3">
            <InventoryCategoryCards stats={categoryStats} />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="space-y-3 border-b border-border-gray px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
              {activeCategoryName ?? "All products"}
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Rows at or below their low-stock threshold are flagged.
              <span className="ml-1.5 tabular-nums text-dark-charcoal">
                · {filtered.length} item{filtered.length === 1 ? "" : "s"}
                {filtered.length > 0 ? ` · showing ${rangeStart}–${rangeEnd}` : ""}
              </span>
            </p>
          </div>

          <AdminInventoryFilterBar
            q={q}
            category={categoryId}
            brand={brandId}
            stock={stock}
            sort={sort}
            categories={categoryStats.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name }))}
            hasFilters={hasFilters}
            clearHref="/admin/inventory"
          />
        </div>

        <DataTable
          className="rounded-none border-0"
          columns={[
            { key: "product", header: "Product" },
            { key: "sku", header: "SKU" },
            { key: "category", header: "Category" },
            { key: "qty", header: "On hand" },
            { key: "threshold", header: "Threshold" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
            { key: "actions", header: "Actions", className: "text-right" },
          ]}
          emptyMessage={
            hasFilters
              ? "No inventory rows match these filters."
              : "No inventory records."
          }
          rows={pageItems.map((p) => {
            const state = stockState(p);
            const imageUrl = productImageUrl(p);
            return [
              <div key={`${p.id}-product`} className="flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                    unoptimized={
                      imageUrl.startsWith("data:") ||
                      imageUrl.startsWith("blob:")
                    }
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={withAdminReturn(
                      `/admin/products/${p.id}`,
                      "inventory",
                    )}
                    className="font-medium text-dark-charcoal hover:text-titan-yellow"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-medium-gray">
                    {p.brand?.name ?? "—"}
                  </p>
                </div>
              </div>,
              <span key={`${p.id}-sku`} className="text-medium-gray">
                {p.sku}
              </span>,
              <span key={`${p.id}-cat`}>{p.category?.name ?? "—"}</span>,
              <span
                key={`${p.id}-qty`}
                className={cn(
                  "tabular-nums",
                  state === "out" && "font-semibold text-red-700",
                  state === "low" && "font-semibold text-warning-orange",
                )}
              >
                {p.inventory_quantity}
              </span>,
              <span key={`${p.id}-th`} className="tabular-nums text-medium-gray">
                {p.low_stock_threshold}
              </span>,
              <span key={`${p.id}-value`} className="tabular-nums">
                {formatCurrency(stockValue(p))}
              </span>,
              state === "out" ? (
                <Badge key={`${p.id}-st`} variant="warning">
                  Out of stock
                </Badge>
              ) : state === "low" ? (
                <Badge key={`${p.id}-st`} variant="warning">
                  Low stock
                </Badge>
              ) : (
                <Badge key={`${p.id}-st`} variant="success">
                  OK
                </Badge>
              ),
              <div key={`${p.id}-actions`} className="flex justify-end gap-2">
                <Link
                  href={withAdminReturn(
                    `/admin/products/${p.id}`,
                    "inventory",
                  )}
                  className="inline-flex h-8 items-center rounded-sm border border-border-gray px-3 text-xs font-semibold uppercase tracking-wide hover:bg-light-gray"
                >
                  Edit
                </Link>
                <ReplenishProductButton
                  productId={p.id}
                  productName={p.name}
                  currentQty={p.inventory_quantity ?? 0}
                />
              </div>,
            ];
          })}
        />

        {totalPages > 1 ? (
          <div className="flex flex-col items-center gap-2 border-t border-border-gray px-4 py-4 sm:px-5">
            <p className="text-xs text-medium-gray">
              Page {page} of {totalPages} · {ITEMS_PER_PAGE} per page
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/inventory"
              searchParams={{
                q: q.trim() || undefined,
                category: categoryId || undefined,
                brand: brandId || undefined,
                stock: stock === "all" ? undefined : stock,
                sort: sort === INVENTORY_DEFAULT_SORT ? undefined : sort,
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
