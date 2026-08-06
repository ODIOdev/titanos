import Link from "next/link";
import {
  Archive,
  FilePenLine,
  Package,
  TriangleAlert,
} from "lucide-react";
import { AdminProductsFilterBar } from "@/components/admin/admin-products-filter-bar";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { ProductsMobileChrome } from "@/components/admin/products-mobile-chrome";
import { Pagination } from "@/components/products/pagination";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminProducts,
} from "@/lib/data/admin";
import { productSearchScore } from "@/lib/search";
import {
  formatProductStockBySize,
  getProductStockBySize,
  getProductStockQuantity,
  getProductStockState,
} from "@/lib/catalog/product-stock";
import {
  cn,
  formatCurrency,
  getCatalogStatus,
} from "@/lib/utils";
import type { Product } from "@/types";

const FALLBACK_IMAGE = "/images/products/titan-premium-vented-hard-hat.svg";
/** Status bars fill completely at this catalog size. */
const STATUS_BAR_CAP = 100;
const PRODUCTS_PER_PAGE = 30;

type TabId = "active" | "draft" | "archived";
type StockFilter = "all" | "low" | "out" | "ok";

type SearchParams = Promise<{
  q?: string;
  tab?: string;
  category?: string;
  brand?: string;
  stock?: string;
  page?: string;
}>;

function productImageUrl(p: Product) {
  return (
    p.image_url ??
    p.images?.find((img) => img.is_primary)?.url ??
    p.images?.[0]?.url ??
    FALLBACK_IMAGE
  );
}

function parseTab(value: string | undefined): TabId {
  if (value === "draft" || value === "archived") return value;
  return "active";
}

function parseStock(value: string | undefined): StockFilter {
  if (value === "low" || value === "out" || value === "ok") return value;
  return "all";
}

function buildHref(opts: {
  tab?: TabId;
  q?: string;
  category?: string;
  brand?: string;
  stock?: StockFilter;
}) {
  const params = new URLSearchParams();
  if (opts.tab && opts.tab !== "active") params.set("tab", opts.tab);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.category) params.set("category", opts.category);
  if (opts.brand) params.set("brand", opts.brand);
  if (opts.stock && opts.stock !== "all") params.set("stock", opts.stock);
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

function matchesStock(p: Product, stock: StockFilter) {
  if (stock === "all") return true;
  const state = getProductStockState(p);
  if (stock === "out") return state === "out";
  if (stock === "low") return state === "low";
  return state === "ok";
}

function AnalyticTab({
  href,
  label,
  count,
  hint,
  icon: Icon,
  active,
  accent,
  barClass,
  share,
}: {
  href: string;
  label: string;
  count: number;
  hint: string;
  icon: typeof Package;
  active: boolean;
  accent: string;
  barClass: string;
  share: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-sm border bg-white p-4 transition-colors",
        active
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
            {label}
          </p>
          <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal sm:text-3xl">
            {count}
          </p>
          <p className="mt-1 text-xs text-medium-gray">{hint}</p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-sm sm:size-10",
            accent,
          )}
        >
          <Icon className="size-4 sm:size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-light-gray">
        <div
          className={cn("h-full rounded-full transition-all", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
        />
      </div>
    </Link>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const q = params.q ?? "";
  const categoryId = params.category ?? "";
  const brandId = params.brand ?? "";
  const stock = parseStock(params.stock);
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [products, categories, brands] = await Promise.all([
    getAdminProducts({ q, active: "all" }),
    getAdminCategories(),
    getAdminBrands(),
  ]);

  const active = products.filter((p) => getCatalogStatus(p) === "active");
  const drafts = products.filter((p) => getCatalogStatus(p) === "draft");
  const archived = products.filter((p) => getCatalogStatus(p) === "archived");
  const lowStock = active.filter((p) => matchesStock(p, "low"));
  const inventoryUnits = active.reduce(
    (sum, p) => sum + getProductStockQuantity(p),
    0,
  );
  const catalogValue = active.reduce(
    (sum, p) => sum + Number(p.price ?? 0) * getProductStockQuantity(p),
    0,
  );

  const statusBarShare = (count: number) =>
    Math.min(100, (count / STATUS_BAR_CAP) * 100);

  const lists: Record<TabId, Product[]> = {
    active,
    draft: drafts,
    archived,
  };

  const visible = lists[tab]
    .filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (brandId && p.brand_id !== brandId) return false;
      if (!matchesStock(p, stock)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!q.trim()) return a.name.localeCompare(b.name);
      const scoreDiff = productSearchScore(b, q) - productSearchScore(a, q);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.max(1, Math.ceil(visible.length / PRODUCTS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);
  const pageStart = (page - 1) * PRODUCTS_PER_PAGE;
  const pageItems = visible.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);
  const rangeStart = visible.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, visible.length);

  const hasFilters = Boolean(q.trim() || categoryId || brandId || stock !== "all");

  const tabMeta: Record<
    TabId,
    { title: string; description: string; empty: string }
  > = {
    active: {
      title: stock === "low" ? "Low stock" : "Live products",
      description:
        stock === "low"
          ? "Active products at or below their low-stock threshold."
          : "Visible in the shop and available to purchase.",
      empty:
        stock === "low"
          ? "No low-stock products right now."
          : "No live products. Create one or restore from drafts/archive.",
    },
    draft: {
      title: "Drafts",
      description: "Work-in-progress — hidden from the storefront.",
      empty: "No drafts right now.",
    },
    archived: {
      title: "Archived",
      description: "Retired items kept for history.",
      empty: "No archived products.",
    },
  };

  const filterState = { tab, q, category: categoryId, brand: brandId, stock };
  const isEmptyCatalog =
    !hasFilters &&
    tab === "active" &&
    stock === "all" &&
    active.length === 0 &&
    drafts.length === 0 &&
    archived.length === 0;

  const statusChips = [
    {
      kind: "products" as const,
      href: buildHref({ ...filterState, tab: "active" as const, stock: "all" as const }),
      label: "Products",
      count: active.length,
      active: tab === "active" && stock === "all",
    },
    {
      kind: "drafts" as const,
      href: buildHref({ ...filterState, tab: "draft" as const, stock: "all" as const }),
      label: "Drafts",
      count: drafts.length,
      active: tab === "draft",
    },
    {
      kind: "archived" as const,
      href: buildHref({
        ...filterState,
        tab: "archived" as const,
        stock: "all" as const,
      }),
      label: "Archived",
      count: archived.length,
      active: tab === "archived",
    },
    {
      kind: "lowStock" as const,
      href: buildHref({
        ...filterState,
        tab: "active" as const,
        stock: "low" as const,
      }),
      label: "Low stock",
      count: lowStock.length,
      active: stock === "low",
      alert: lowStock.length > 0,
    },
  ];

  const rangeLabel =
    visible.length > 0 ? `showing ${rangeStart}–${rangeEnd}` : "";

  return (
    <div>
      <ProductsMobileChrome
        title={tabMeta[tab].title}
        description={tabMeta[tab].description}
        itemCount={visible.length}
        rangeLabel={rangeLabel}
        statusChips={statusChips}
        tab={tab}
        q={q}
        categoryId={categoryId}
        brandId={brandId}
        stock={stock}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        hasFilters={hasFilters}
        clearHref={buildHref({ tab })}
        isEmptyCatalog={isEmptyCatalog}
      />

      {/* Not sticky below @5xl: it would sit under the sticky admin mobile bar. */}
      <div className="admin-products-desktop-chrome static z-20 hidden space-y-5 bg-light-gray pb-0 pt-1 @5xl:sticky @5xl:top-0 @5xl:block">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <AnalyticTab
            href={buildHref({ ...filterState, tab: "active", stock: "all" })}
            label="Products"
            count={active.length}
            hint={`${inventoryUnits.toLocaleString()} units on hand`}
            icon={Package}
            active={tab === "active" && stock === "all"}
            accent="bg-emerald-100 text-emerald-800"
            barClass="bg-emerald-400"
            share={statusBarShare(active.length)}
          />
          <AnalyticTab
            href={buildHref({ ...filterState, tab: "draft", stock: "all" })}
            label="Drafts"
            count={drafts.length}
            hint="Not published yet"
            icon={FilePenLine}
            active={tab === "draft"}
            accent="bg-amber-100 text-amber-800"
            barClass="bg-amber-400"
            share={statusBarShare(drafts.length)}
          />
          <AnalyticTab
            href={buildHref({ ...filterState, tab: "archived", stock: "all" })}
            label="Archived"
            count={archived.length}
            hint="Hidden from shop"
            icon={Archive}
            active={tab === "archived"}
            accent="bg-slate-100 text-slate-700"
            barClass="bg-slate-400"
            share={statusBarShare(archived.length)}
          />
          <AnalyticTab
            href={buildHref({ ...filterState, tab: "active", stock: "low" })}
            label="Low stock"
            count={lowStock.length}
            hint={`${formatCurrency(catalogValue)} inventory value`}
            icon={TriangleAlert}
            active={stock === "low"}
            accent={
              lowStock.length > 0
                ? "bg-orange-100 text-orange-800"
                : "bg-emerald-100 text-emerald-800"
            }
            barClass={lowStock.length > 0 ? "bg-orange-400" : "bg-emerald-400"}
            share={statusBarShare(lowStock.length)}
          />
        </div>

        <div className="rounded-t-sm border border-border-gray bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
          <div className="space-y-3 border-b border-border-gray px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
                  {tabMeta[tab].title}
                </h2>
                <p className="mt-0.5 text-sm text-medium-gray">
                  {tabMeta[tab].description}
                  <span className="ml-1.5 tabular-nums text-dark-charcoal">
                    · {visible.length} item{visible.length === 1 ? "" : "s"}
                    {visible.length > 0
                      ? ` · showing ${rangeStart}–${rangeEnd}`
                      : ""}
                  </span>
                </p>
              </div>
              <Link
                href="/admin/products/new"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
              >
                New product
              </Link>
            </div>

            <AdminProductsFilterBar
              tab={tab}
              q={q}
              categoryId={categoryId}
              brandId={brandId}
              stock={stock}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              brands={brands.map((b) => ({ id: b.id, name: b.name }))}
              hasFilters={hasFilters}
              clearHref={buildHref({ tab })}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border border-border-gray bg-white",
          isEmptyCatalog
            ? "mt-3 hidden rounded-sm @5xl:mt-0 @5xl:block @5xl:rounded-b-sm @5xl:rounded-t-none @5xl:border-t-0"
            : "rounded-b-sm border-t-0",
        )}
      >
        <AdminProductsTable
          tab={tab}
          emptyMessage={
            hasFilters
              ? `No ${tabMeta[tab].title.toLowerCase()} match these filters.`
              : tabMeta[tab].empty
          }
          products={pageItems.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            categoryName: p.category?.name ?? null,
            brandName: p.brand?.name ?? null,
            price: Number(p.price ?? 0),
            inventoryQuantity: getProductStockQuantity(p),
            lowStockThreshold: p.low_stock_threshold ?? 0,
            stockBySize: formatProductStockBySize(p),
            stockSizes: getProductStockBySize(p),
            status: getCatalogStatus(p),
            imageUrl: productImageUrl(p),
            shortDescription: p.short_description,
            editHref: `/admin/products/${p.id}`,
          }))}
        />

        {totalPages > 1 ? (
          <div className="flex flex-col items-center gap-2 border-t border-border-gray px-4 py-4 sm:px-5">
            <p className="text-xs text-medium-gray">
              Page {page} of {totalPages} · {PRODUCTS_PER_PAGE} per page
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/products"
              searchParams={{
                tab: tab === "active" ? undefined : tab,
                q: q.trim() || undefined,
                category: categoryId || undefined,
                brand: brandId || undefined,
                stock: stock === "all" ? undefined : stock,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
