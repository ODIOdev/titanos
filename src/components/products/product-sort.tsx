"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Selling", value: "bestselling" },
  { label: "Highest Rated", value: "rating" },
] as const;

export type ProductSortProps = {
  className?: string;
  paramKey?: string;
  /** "inline" keeps the label beside the control for toolbars. */
  layout?: "stacked" | "inline";
};

export function ProductSort({
  className,
  paramKey = "sort",
  layout = "stacked",
}: ProductSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectId = `${paramKey}-select`;
  const current = searchParams.get(paramKey) ?? "featured";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "featured") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  if (layout === "inline") {
    return (
      <div
        className={cn("flex shrink-0 items-center gap-2", className)}
        aria-busy={isPending}
      >
        <label
          htmlFor={selectId}
          className="hidden shrink-0 text-sm text-medium-gray sm:block"
        >
          Sort
        </label>
        <div className="w-[11rem] sm:w-[12.5rem]">
          <Select
            id={selectId}
            aria-label="Sort products"
            options={[...SORT_OPTIONS]}
            value={current}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-w-[12rem]", className)} aria-busy={isPending}>
      <Select
        label="Sort by"
        options={[...SORT_OPTIONS]}
        value={current}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
