import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { buttonVariants } from "@/components/ui/button";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export type ProductGridProps = {
  products: Product[];
  className?: string;
  emptyMessage?: string;
};

export function ProductGrid({
  products,
  className,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-sm border border-border-gray bg-light-gray px-6 py-14 text-center">
        <PackageSearch
          className="size-10 text-medium-gray"
          aria-hidden="true"
        />
        <p className="mt-3 text-medium-gray">{emptyMessage}</p>
        <Link
          href="/shop"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-5")}
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
