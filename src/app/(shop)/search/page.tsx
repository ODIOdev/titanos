import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/products/product-grid";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { searchProducts } from "@/lib/data/products";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { absoluteUrl, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description: `Search safety equipment and PPE from ${SITE_CONFIG.name}.`,
  alternates: {
    canonical: absoluteUrl("/search"),
  },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const products = q ? await searchProducts(q, 48) : [];

  return (
    <div className="container-titan py-8 lg:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
      />

      <div className="mb-8">
        <h1 className="font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
          {q ? `Search results for “${q}”` : "Search"}
        </h1>
        <p className="mt-2 text-medium-gray">
          {q
            ? `${products.length} product${products.length === 1 ? "" : "s"} found`
            : "Enter a search term to find safety gear, workwear, and traffic control products."}
        </p>
      </div>

      {!q ? (
        <EmptyState
          icon={<Search />}
          title="Start searching"
          description="Use the search bar above or browse the full catalog."
          action={
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "primary" }))}
            >
              Browse shop
            </Link>
          }
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No matches"
          description={`We couldn’t find products matching “${q}”. Try a different keyword or browse by category.`}
          action={
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View all products
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
