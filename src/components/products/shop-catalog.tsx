import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { ProductSort } from "@/components/products/product-sort";
import { ShopCategoryRail } from "@/components/products/shop-category-rail";
import { Pagination } from "@/components/products/pagination";
import {
  buildShopFilterChips,
  ShopActiveFilters,
  type ShopFilterOptions,
  type ShopFilterQuery,
} from "@/components/products/shop-active-filters";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { getBrands, getCategories, getProducts } from "@/lib/data/products";
import {
  parseShopFilters,
  toFilterQuery,
  type ShopSearchParams,
} from "@/lib/shop/filters";
import type { ProductFilters as ProductFiltersType } from "@/types";
import { SEED_PRODUCTS } from "@/lib/data/seed-data";
import {
  ANSI_CLASS_OPTIONS,
  DEPARTMENT_OPTIONS,
  COLOR_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  SIZE_OPTIONS,
  mergeCatalogOptions,
} from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export type ShopCatalogProps = {
  searchParams: ShopSearchParams;
  categorySlug?: string;
  title: string;
  description?: string;
  basePath: string;
  breadcrumbLabel?: string;
};

type CatalogResults = {
  products: Awaited<ReturnType<typeof getProducts>>["products"];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
};

/** Never rejects, so the same promise can be awaited by several children. */
async function loadResults(
  filters: ProductFiltersType,
): Promise<CatalogResults> {
  try {
    const result = await getProducts(filters, PAGE_SIZE);
    return { ...result, error: null };
  } catch {
    return {
      products: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      error: "We couldn’t load products right now. Please try again.",
    };
  }
}

async function ResultCount({
  results,
}: {
  results: Promise<CatalogResults>;
}) {
  const { total, page, pageSize, error } = await results;

  if (error) return <p className="text-sm text-medium-gray">—</p>;
  if (total === 0) {
    return <p className="text-sm text-medium-gray">No products</p>;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <p className="text-sm text-medium-gray">
      Showing{" "}
      <span className="font-semibold text-dark-charcoal tabular-nums">
        {start}–{end}
      </span>{" "}
      of{" "}
      <span className="font-semibold text-dark-charcoal tabular-nums">
        {total}
      </span>{" "}
      products
    </p>
  );
}

async function ResultGrid({
  results,
  basePath,
  paginationQuery,
  hasFilters,
}: {
  results: Promise<CatalogResults>;
  basePath: string;
  paginationQuery: ShopFilterQuery;
  hasFilters: boolean;
}) {
  const { products, total, page, pageSize, error } = await results;

  if (error) return <ErrorMessage message={error} />;

  if (total === 0) {
    return (
      <EmptyState
        className="rounded-sm border border-border-gray bg-white"
        icon={<PackageSearch />}
        title="No products found"
        description={
          hasFilters
            ? "No products match every filter you picked. Try removing one to widen the results."
            : "This catalog is empty right now. Please check back soon."
        }
        action={
          hasFilters ? (
            <Link
              href={basePath}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Clear all filters
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <ProductGrid
        products={products}
        emptyMessage="No products match these filters."
      />
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        basePath={basePath}
        searchParams={paginationQuery}
      />
    </div>
  );
}

export async function ShopCatalog({
  searchParams,
  categorySlug,
  title,
  description,
  basePath,
  breadcrumbLabel,
}: ShopCatalogProps) {
  const filters: ProductFiltersType = parseShopFilters(searchParams, {
    category: categorySlug ?? parseShopFilters(searchParams).category,
  });

  // Start the product query before awaiting filter options so the shell can
  // paint while results stream in below.
  const results = loadResults(filters);

  const [categories, brands] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);

  // Keep shop filters aligned with admin dropdowns (plus any legacy product values).
  const filterOptions: ShopFilterOptions = {
    departments: DEPARTMENT_OPTIONS.map((d) => ({
      label: d.label,
      value: d.value,
    })),
    categories: categorySlug
      ? []
      : categories.map((c) => ({ label: c.name, value: c.slug })),
    brands: brands.map((b) => ({ label: b.name, value: b.slug })),
    productTypes: mergeCatalogOptions(
      PRODUCT_TYPE_OPTIONS,
      SEED_PRODUCTS.map((p) => p.product_type),
    ),
    ansiClasses: mergeCatalogOptions(
      ANSI_CLASS_OPTIONS,
      SEED_PRODUCTS.map((p) => p.ansi_class),
    ),
    colors: mergeCatalogOptions(
      COLOR_OPTIONS,
      SEED_PRODUCTS.map((p) => p.color),
    ),
    sizes: mergeCatalogOptions(
      SIZE_OPTIONS,
      SEED_PRODUCTS.map((p) => p.size),
    ),
  };

  const query = toFilterQuery(searchParams);
  const paginationQuery = { ...query };
  if (categorySlug) delete paginationQuery.category;

  const chips = buildShopFilterChips(query, filterOptions, {
    hideCategory: Boolean(categorySlug),
  });
  // Re-render the skeleton whenever the applied filters change.
  const resultsKey = new URLSearchParams(
    Object.entries(query).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString();

  return (
    <div className="container-titan py-6 lg:py-10">
      <Breadcrumbs
        className="mb-5"
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(breadcrumbLabel
            ? [{ label: breadcrumbLabel, href: basePath }]
            : []),
        ]}
      />

      <header className="border-b border-border-gray pb-6">
        <div className="max-w-4xl border-l-4 border-titan-yellow pl-4 sm:pl-5">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-medium-gray">
            {breadcrumbLabel ? "Category" : "Full catalog"}
          </p>
          <h1 className="mt-1.5 font-heading text-4xl uppercase leading-[1.05] text-dark-charcoal md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-medium-gray line-clamp-1">{description}</p>
          ) : null}
        </div>
      </header>

      <ShopCategoryRail
        categories={categories}
        activeSlug={categorySlug}
        className="mt-5"
      />

      <ShopActiveFilters
        basePath={basePath}
        query={query}
        chips={chips}
        className="mt-4"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-8 xl:grid-cols-[18rem_1fr]">
        <Suspense
          fallback={
            <div className="hidden h-96 animate-pulse rounded-sm bg-light-gray lg:block" />
          }
        >
          <ProductFilters
            departments={filterOptions.departments}
            categories={filterOptions.categories}
            brands={filterOptions.brands}
            productTypes={filterOptions.productTypes}
            ansiClasses={filterOptions.ansiClasses}
            colors={filterOptions.colors}
            sizes={filterOptions.sizes}
            activeCount={chips.length}
          />
        </Suspense>

        <div className="min-w-0">
          <div className="sticky top-14 z-20 mb-5 flex items-center justify-between gap-4 rounded-sm border border-border-gray bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4 lg:top-16">
            <div className="flex min-w-0 items-center gap-3">
              <Suspense
                key={resultsKey}
                fallback={
                  <span className="h-4 w-40 animate-pulse rounded-sm bg-light-gray" />
                }
              >
                <ResultCount results={results} />
              </Suspense>
              {chips.length > 0 ? (
                <Link
                  href={basePath}
                  className="hidden shrink-0 text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline sm:block"
                >
                  Clear all
                </Link>
              ) : null}
            </div>
            <Suspense
              fallback={
                <div className="h-10 w-44 animate-pulse rounded-sm bg-light-gray" />
              }
            >
              <ProductSort layout="inline" />
            </Suspense>
          </div>

          <Suspense key={resultsKey} fallback={<ProductGridSkeleton />}>
            <ResultGrid
              results={results}
              basePath={basePath}
              paginationQuery={paginationQuery}
              hasFilters={chips.length > 0}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
