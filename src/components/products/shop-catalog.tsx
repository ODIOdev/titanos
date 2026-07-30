import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductSort } from "@/components/products/product-sort";
import { Pagination } from "@/components/products/pagination";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  getBrands,
  getCategories,
  getProducts,
} from "@/lib/data/products";
import {
  parseShopFilters,
  toFilterQuery,
  type ShopSearchParams,
} from "@/lib/shop/filters";
import type { ProductFilters as ProductFiltersType } from "@/types";
import { SEED_PRODUCTS } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export type ShopCatalogProps = {
  searchParams: ShopSearchParams;
  categorySlug?: string;
  title: string;
  description?: string;
  basePath: string;
  breadcrumbLabel?: string;
};

function uniqueOptions(
  values: (string | null | undefined)[],
): { label: string; value: string }[] {
  const seen = new Set<string>();
  const options: { label: string; value: string }[] = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ label: value, value });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
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

  let products: Awaited<ReturnType<typeof getProducts>>["products"] = [];
  let total = 0;
  let page = 1;
  let pageSize = 12;
  let error: string | null = null;

  try {
    const result = await getProducts(filters, 12);
    products = result.products;
    total = result.total;
    page = result.page;
    pageSize = result.pageSize;
  } catch {
    error = "We couldn’t load products right now. Please try again.";
  }

  const [categories, brands] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);

  const filterOptions = {
    categories: categorySlug
      ? []
      : categories.map((c) => ({ label: c.name, value: c.slug })),
    brands: brands.map((b) => ({ label: b.name, value: b.slug })),
    productTypes: uniqueOptions(SEED_PRODUCTS.map((p) => p.product_type)),
    ansiClasses: uniqueOptions(SEED_PRODUCTS.map((p) => p.ansi_class)),
    colors: uniqueOptions(SEED_PRODUCTS.map((p) => p.color)),
    sizes: uniqueOptions(SEED_PRODUCTS.map((p) => p.size)),
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const queryForPagination = toFilterQuery(searchParams);
  if (categorySlug) delete queryForPagination.category;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="container-titan py-8 lg:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(breadcrumbLabel
            ? [{ label: breadcrumbLabel, href: basePath }]
            : []),
        ]}
      />

      <div className="mb-8">
        <h1 className="font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-medium-gray">{description}</p>
        ) : null}
      </div>

      {error ? (
        <ErrorMessage message={error} className="mb-8" />
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
        <Suspense
          fallback={
            <div className="hidden h-64 animate-pulse rounded-sm bg-light-gray lg:block" />
          }
        >
          <ProductFilters
            categories={filterOptions.categories}
            brands={filterOptions.brands}
            productTypes={filterOptions.productTypes}
            ansiClasses={filterOptions.ansiClasses}
            colors={filterOptions.colors}
            sizes={filterOptions.sizes}
          />
        </Suspense>

        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-medium-gray">
              {total === 0
                ? "No products"
                : `Showing ${start}–${end} of ${total} products`}
            </p>
            <Suspense
              fallback={
                <div className="h-10 w-48 animate-pulse rounded-sm bg-light-gray" />
              }
            >
              <ProductSort />
            </Suspense>
          </div>

          {!error && total === 0 ? (
            <EmptyState
              icon={<PackageSearch />}
              title="No products found"
              description="Try adjusting your filters or search terms to find what you need."
              action={
                <Link
                  href={basePath}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Clear filters
                </Link>
              }
            />
          ) : (
            <>
              <ProductGrid
                products={products}
                emptyMessage="No products match these filters."
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath={basePath}
                searchParams={queryForPagination}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
