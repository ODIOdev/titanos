import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductFilters, SHOP_FILTERS_MOBILE_ROOT_ID } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { ProductSort } from "@/components/products/product-sort";
import { ShopDepartmentRail } from "@/components/products/shop-department-rail";
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
import { getCatalogDepartmentOptions } from "@/lib/data/admin";
import {
  parseShopFilters,
  toFilterQuery,
  type ShopSearchParams,
} from "@/lib/shop/filters";
import type { ProductFilters as ProductFiltersType } from "@/types";
import { SEED_PRODUCTS } from "@/lib/data/seed-data";
import {
  COLOR_OPTIONS,
  GENDER_OPTIONS,
  SHOE_SIZE_OPTIONS,
  SHOP_ANSI_CERTIFICATION_OPTIONS,
  SHOP_MATERIAL_OPTIONS,
  SHOP_HIDDEN_DEPARTMENTS,
  SIZE_OPTIONS,
  compareCatalogSizes,
  mergeCatalogOptions,
  parseAnsiClasses,
  productMaterialValues,
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

  if (error) return <p className="truncate text-sm text-medium-gray">—</p>;
  if (total === 0) {
    return (
      <p className="truncate text-sm text-medium-gray">No products</p>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <p className="shop-result-count truncate text-sm text-medium-gray">
      <span className="shop-result-count-compact @3xl:hidden">
        <span className="font-semibold text-dark-charcoal tabular-nums">
          {total}
        </span>{" "}
        products
      </span>
      <span className="shop-result-count-full hidden @3xl:inline">
        Showing{" "}
        <span className="font-semibold text-dark-charcoal tabular-nums">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-dark-charcoal tabular-nums">
          {total}
        </span>{" "}
        products
      </span>
    </p>
  );
}

function ShopResultsToolbar({
  results,
  resultsKey,
  basePath,
  chipsCount,
  className,
}: {
  results: Promise<CatalogResults>;
  resultsKey: string;
  basePath: string;
  chipsCount: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shop-results-toolbar flex flex-col gap-2.5 rounded-sm border border-border-gray bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4 @3xl:px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Suspense
          key={resultsKey}
          fallback={
            <span className="h-4 w-40 animate-pulse rounded-sm bg-light-gray" />
          }
        >
          <ResultCount results={results} />
        </Suspense>
        {chipsCount > 0 ? (
          <Link
            href={basePath}
            className="hidden shrink-0 text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline @3xl:block"
          >
            Clear all
          </Link>
        ) : null}
      </div>
      <Suspense
        fallback={
          <div className="h-10 w-full animate-pulse rounded-sm bg-light-gray @3xl:w-44" />
        }
      >
        <ProductSort layout="inline" className="w-full min-w-0 @3xl:w-auto" />
      </Suspense>
    </div>
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

  const [categories, brands, departmentOptions] = await Promise.all([
    getCategories(),
    getBrands(),
    getCatalogDepartmentOptions({ liveOnly: true }),
  ]);

  // Keep shop filters aligned with admin dropdowns (plus any legacy product values).
  // Industry parents (e.g. Safety Equipment) stay on the homepage only.
  const filterOptions: ShopFilterOptions = {
    departments: departmentOptions
      .filter((d) => !SHOP_HIDDEN_DEPARTMENTS.has(d.value.toLowerCase()))
      .map((d) => ({
        label: d.label,
        value: d.value,
      })),
    categories: categorySlug
      ? []
      : categories.map((c) => ({ label: c.name, value: c.slug })),
    brands: brands.map((b) => ({ label: b.name, value: b.slug })),
    genders: GENDER_OPTIONS.map((g) => ({ label: g.label, value: g.value })),
    ansiClasses: mergeCatalogOptions(
      SHOP_ANSI_CERTIFICATION_OPTIONS,
      [
        ...SEED_PRODUCTS.flatMap((p) => parseAnsiClasses(p.ansi_class)),
        ...SEED_PRODUCTS.flatMap((p) => p.certifications),
      ],
    ),
    materials: mergeCatalogOptions(
      SHOP_MATERIAL_OPTIONS,
      SEED_PRODUCTS.flatMap((p) =>
        productMaterialValues({
          metadata: null,
          specifications: p.specifications,
        }),
      ),
    ),
    colors: mergeCatalogOptions(
      COLOR_OPTIONS,
      SEED_PRODUCTS.map((p) => p.color),
    ),
    sizes: mergeCatalogOptions(
      [...SIZE_OPTIONS, ...SHOE_SIZE_OPTIONS],
      SEED_PRODUCTS.map((p) => p.size),
      {
        compare: (a, b) =>
          compareCatalogSizes(a.label || a.value, b.label || b.value),
      },
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

  const departmentValue = query.department ?? query.group;
  const departmentLabel = departmentValue
    ? filterOptions.departments.find((d) => d.value === departmentValue)
        ?.label ?? departmentValue
    : null;
  const brandLabel = query.brand
    ? filterOptions.brands.find((b) => b.value === query.brand)?.label ??
      query.brand
    : null;

  const breadcrumbTrail: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];

  if (breadcrumbLabel) {
    breadcrumbTrail.push({
      label: breadcrumbLabel,
      href: departmentLabel || brandLabel || query.q ? basePath : undefined,
    });
  }

  if (departmentLabel) {
    breadcrumbTrail.push({
      label: departmentLabel,
      href: brandLabel || query.q
        ? `${basePath}?department=${encodeURIComponent(departmentValue!)}`
        : undefined,
    });
  }

  if (brandLabel) {
    breadcrumbTrail.push({
      label: brandLabel,
      href: query.q
        ? (() => {
            const params = new URLSearchParams();
            if (departmentValue) params.set("department", departmentValue);
            params.set("brand", query.brand!);
            return `${basePath}?${params.toString()}`;
          })()
        : undefined,
    });
  }

  if (query.q) {
    breadcrumbTrail.push({ label: `“${query.q}”` });
  } else if (!breadcrumbLabel && !departmentLabel && !brandLabel) {
    // Base /shop — keep Shop as the parent link and name the product catalog.
    breadcrumbTrail.push({ label: "All Products" });
  }

  return (
    <div className="container-titan py-6 @5xl:py-10">
      <Breadcrumbs className="mb-5" items={breadcrumbTrail} />

      <header className="border-b border-border-gray pb-3 @5xl:pb-6">
        <div className="max-w-4xl border-l-2 border-titan-yellow pl-3 @5xl:border-l-4 @5xl:pl-5">
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-medium-gray @5xl:text-[11px] @5xl:tracking-[0.2em]">
            {breadcrumbLabel ? "Category" : "Full catalog"}
          </p>
          <h1 className="mt-0.5 font-heading text-2xl uppercase leading-[1.1] text-dark-charcoal @5xl:mt-1.5 @5xl:text-5xl @5xl:leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="shop-catalog-description mt-3 hidden text-medium-gray line-clamp-1 @5xl:block">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      <ShopDepartmentRail
        departments={filterOptions.departments}
        activeDepartment={query.department}
        basePath={basePath}
        className="mt-4 @5xl:mt-5"
      />

      <div
        className="shop-filters-mobile-root sticky top-[calc(3.5rem+var(--phone-safe-top,0px)+env(safe-area-inset-top,0px))] z-20 mt-4 space-y-2.5 @5xl:hidden"
      >
        <div id={SHOP_FILTERS_MOBILE_ROOT_ID} />
        <ShopResultsToolbar
          results={results}
          resultsKey={resultsKey}
          basePath={basePath}
          chipsCount={chips.length}
        />
      </div>

      <ShopActiveFilters
        basePath={basePath}
        query={query}
        chips={chips}
        className="mt-4"
      />

      <div className="mt-6 grid gap-6 @5xl:grid-cols-[16rem_1fr] @5xl:gap-8 xl:grid-cols-[18rem_1fr]">
        <Suspense
          fallback={
            <div className="hidden h-96 animate-pulse rounded-sm bg-light-gray @5xl:block" />
          }
        >
          <ProductFilters
            departments={filterOptions.departments}
            categories={filterOptions.categories}
            brands={filterOptions.brands}
            genders={filterOptions.genders}
            ansiClasses={filterOptions.ansiClasses}
            materials={filterOptions.materials}
            colors={filterOptions.colors}
            sizes={filterOptions.sizes}
            priceBounds={{
              min: 0,
              max: Math.max(
                350,
                Math.ceil(
                  Math.max(...SEED_PRODUCTS.map((p) => p.price), 350) / 10,
                ) * 10,
              ),
            }}
            activeCount={chips.length}
          />
        </Suspense>

        <div className="min-w-0">
          <ShopResultsToolbar
            results={results}
            resultsKey={resultsKey}
            basePath={basePath}
            chipsCount={chips.length}
            className="sticky top-16 z-20 mb-5 hidden @5xl:flex"
          />

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
