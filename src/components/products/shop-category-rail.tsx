import Link from "next/link";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

export type ShopCategoryRailProps = {
  categories: Category[];
  /** Slug of the category page currently being viewed, if any. */
  activeSlug?: string;
  className?: string;
};

const pillClass =
  "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";

/** Quick category switcher so browsing doesn't require opening the filter panel. */
export function ShopCategoryRail({
  categories,
  activeSlug,
  className,
}: ShopCategoryRailProps) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Shop categories"
      className={cn(
        "-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0",
        className,
      )}
    >
      <ul className="flex w-max items-center gap-2 pb-0.5">
        <li>
          <Link
            href="/shop"
            aria-current={activeSlug ? undefined : "page"}
            className={cn(
              pillClass,
              activeSlug
                ? "border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal"
                : "border-dark-charcoal bg-dark-charcoal text-white",
            )}
          >
            All products
          </Link>
        </li>
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <li key={category.id}>
              <Link
                href={`/shop/${category.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  pillClass,
                  active
                    ? "border-dark-charcoal bg-dark-charcoal text-white"
                    : "border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal",
                )}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
