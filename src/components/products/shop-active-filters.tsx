import Link from "next/link";
import { X } from "lucide-react";
import { ColorSwatch } from "@/components/shared/color-swatch";
import type { FilterOption } from "@/components/products/product-filters";
import { cn } from "@/lib/utils";

export type ShopFilterQuery = Record<string, string | undefined>;

export type ShopFilterOptions = {
  departments: FilterOption[];
  categories: FilterOption[];
  brands: FilterOption[];
  genders: FilterOption[];
  ansiClasses: FilterOption[];
  materials: FilterOption[];
  colors: FilterOption[];
  sizes: FilterOption[];
};

type Chip = {
  id: string;
  label: string;
  /** Params dropped when the chip is dismissed. */
  remove: string[];
  swatch?: string;
};

function labelOf(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toLocaleString()}` : `$${value}`;
}

function hrefWithout(
  basePath: string,
  query: ShopFilterQuery,
  remove: string[],
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!value || key === "page" || remove.includes(key)) continue;
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Chips for every applied filter, so the sidebar isn't the only place they show. */
export function buildShopFilterChips(
  query: ShopFilterQuery,
  options: ShopFilterOptions,
  { hideCategory = false }: { hideCategory?: boolean } = {},
): Chip[] {
  const chips: Chip[] = [];

  if (query.q) {
    chips.push({
      id: "q",
      label: `Search: “${query.q}”`,
      remove: ["q"],
    });
  }

  const department = query.department ?? query.group;
  if (department) {
    chips.push({
      id: "department",
      label: labelOf(options.departments, department),
      remove: ["department", "group"],
    });
  }

  if (query.category && !hideCategory) {
    chips.push({
      id: "category",
      label: labelOf(options.categories, query.category),
      remove: ["category"],
    });
  }

  if (query.brand) {
    chips.push({
      id: "brand",
      label: labelOf(options.brands, query.brand),
      remove: ["brand"],
    });
  }

  if (query.gender) {
    chips.push({
      id: "gender",
      label: labelOf(options.genders, query.gender),
      remove: ["gender"],
    });
  }

  if (query.touchScreen === "yes" || query.touchScreen === "no") {
    chips.push({
      id: "touchScreen",
      label: `Touch screen: ${query.touchScreen === "yes" ? "Yes" : "No"}`,
      remove: ["touchScreen"],
    });
  }

  if (query.minPrice || query.maxPrice) {
    const label =
      query.minPrice && query.maxPrice
        ? `${money(query.minPrice)}–${money(query.maxPrice)}`
        : query.minPrice
          ? `Over ${money(query.minPrice)}`
          : `Under ${money(query.maxPrice!)}`;
    chips.push({ id: "price", label, remove: ["minPrice", "maxPrice"] });
  }

  if (query.ansiClass) {
    chips.push({
      id: "ansiClass",
      label: labelOf(options.ansiClasses, query.ansiClass),
      remove: ["ansiClass"],
    });
  }

  if (query.material) {
    chips.push({
      id: "material",
      label: labelOf(options.materials, query.material),
      remove: ["material"],
    });
  }

  if (query.color) {
    chips.push({
      id: "color",
      label: labelOf(options.colors, query.color),
      remove: ["color"],
      swatch: query.color,
    });
  }

  if (query.size) {
    chips.push({
      id: "size",
      label: `Size ${labelOf(options.sizes, query.size)}`,
      remove: ["size"],
    });
  }

  if (query.availability === "in_stock") {
    chips.push({
      id: "availability",
      label: "In stock only",
      remove: ["availability"],
    });
  }

  if (query.rating) {
    chips.push({
      id: "rating",
      label: `${query.rating} stars & up`,
      remove: ["rating"],
    });
  }

  return chips;
}

export function ShopActiveFilters({
  basePath,
  query,
  chips,
  className,
}: {
  basePath: string;
  query: ShopFilterQuery;
  chips: Chip[];
  className?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-medium-gray">
        Filtered by
      </span>
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={hrefWithout(basePath, query, chip.remove)}
          scroll={false}
          className="group inline-flex items-center gap-1.5 rounded-sm border border-border-gray bg-white py-1 pl-2.5 pr-2 text-sm text-dark-charcoal transition-colors hover:border-dark-charcoal"
        >
          {chip.swatch ? <ColorSwatch color={chip.swatch} /> : null}
          <span>{chip.label}</span>
          <X
            className="size-3.5 text-medium-gray transition-colors group-hover:text-dark-charcoal"
            aria-hidden="true"
          />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      {chips.length > 1 ? (
        <Link
          href={hrefWithout(
            basePath,
            query,
            chips.flatMap((chip) => chip.remove),
          )}
          scroll={false}
          className="ml-1 text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
        >
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
