"use client";

import {
  useCallback,
  useId,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

export type ProductFiltersProps = {
  categories?: FilterOption[];
  brands?: FilterOption[];
  productTypes?: FilterOption[];
  ansiClasses?: FilterOption[];
  colors?: FilterOption[];
  sizes?: FilterOption[];
  className?: string;
  priceBounds?: { min: number; max: number };
};

const RATING_OPTIONS = [
  { label: "4 stars & up", value: "4" },
  { label: "3 stars & up", value: "3" },
  { label: "2 stars & up", value: "2" },
] as const;

function FilterSection({
  title,
  children,
  defaultOpen = false,
  active = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || active);
  const panelId = useId();

  return (
    <div className="border-b border-border-gray pb-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 py-2 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="font-heading text-sm uppercase tracking-wide text-dark-charcoal">
          {title}
          {active ? (
            <span className="ml-2 inline-block size-1.5 rounded-full bg-titan-yellow align-middle" />
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-medium-gray transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cn("space-y-3 pb-2", open && "pt-1")}
      >
        {open ? children : null}
      </div>
    </div>
  );
}

function OptionList({
  options,
  paramKey,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  paramKey: string;
  selected: string | null;
  onToggle: (key: string, value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <ul className="space-y-2">
      {options.map((option) => {
        const checked = selected === option.value;
        return (
          <li key={option.value}>
            <Checkbox
              label={
                option.count != null
                  ? `${option.label} (${option.count})`
                  : option.label
              }
              checked={checked}
              onChange={() => onToggle(paramKey, option.value)}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function ProductFilters({
  categories = [],
  brands = [],
  productTypes = [],
  ansiClasses = [],
  colors = [],
  sizes = [],
  className,
  priceBounds = { min: 0, max: 500 },
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = useMemo(
    () => ({
      category: searchParams.get("category"),
      brand: searchParams.get("brand"),
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      productType: searchParams.get("productType"),
      ansiClass: searchParams.get("ansiClass"),
      color: searchParams.get("color"),
      size: searchParams.get("size"),
      availability: searchParams.get("availability"),
      rating: searchParams.get("rating"),
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleParam = useCallback(
    (key: string, value: string) => {
      updateParams((params) => {
        if (params.get(key) === value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
    },
    [updateParams],
  );

  const setPrice = useCallback(
    (key: "minPrice" | "maxPrice", value: string) => {
      updateParams((params) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
    },
    [updateParams],
  );

  const clearAll = useCallback(() => {
    updateParams((params) => {
      [
        "category",
        "brand",
        "minPrice",
        "maxPrice",
        "productType",
        "ansiClass",
        "color",
        "size",
        "availability",
        "rating",
      ].forEach((key) => params.delete(key));
    });
  }, [updateParams]);

  const priceActive = Boolean(current.minPrice || current.maxPrice);

  const filtersBody = (
    <div
      className={cn("space-y-1", isPending && "opacity-70", className)}
      aria-busy={isPending}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-gray pb-4">
        <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
          Filters
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
        >
          Clear all
        </button>
      </div>

      {categories.length > 0 ? (
        <FilterSection
          title="Category"
          defaultOpen
          active={Boolean(current.category)}
        >
          <OptionList
            options={categories}
            paramKey="category"
            selected={current.category}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      {brands.length > 0 ? (
        <FilterSection title="Brand" active={Boolean(current.brand)}>
          <OptionList
            options={brands}
            paramKey="brand"
            selected={current.brand}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      <FilterSection title="Price" active={priceActive}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="min-price" className="sr-only">
              Minimum price
            </Label>
            <Input
              id="min-price"
              type="number"
              min={priceBounds.min}
              max={priceBounds.max}
              placeholder={`Min ${priceBounds.min}`}
              value={current.minPrice}
              onChange={(event) => setPrice("minPrice", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="max-price" className="sr-only">
              Maximum price
            </Label>
            <Input
              id="max-price"
              type="number"
              min={priceBounds.min}
              max={priceBounds.max}
              placeholder={`Max ${priceBounds.max}`}
              value={current.maxPrice}
              onChange={(event) => setPrice("maxPrice", event.target.value)}
            />
          </div>
        </div>
      </FilterSection>

      {productTypes.length > 0 ? (
        <FilterSection
          title="Product type"
          active={Boolean(current.productType)}
        >
          <OptionList
            options={productTypes}
            paramKey="productType"
            selected={current.productType}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      {ansiClasses.length > 0 ? (
        <FilterSection title="ANSI class" active={Boolean(current.ansiClass)}>
          <OptionList
            options={ansiClasses}
            paramKey="ansiClass"
            selected={current.ansiClass}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      {colors.length > 0 ? (
        <FilterSection title="Color" active={Boolean(current.color)}>
          <OptionList
            options={colors}
            paramKey="color"
            selected={current.color}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      {sizes.length > 0 ? (
        <FilterSection title="Size" active={Boolean(current.size)}>
          <OptionList
            options={sizes}
            paramKey="size"
            selected={current.size}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      <FilterSection
        title="Availability"
        active={current.availability === "in_stock"}
      >
        <Checkbox
          label="In stock only"
          checked={current.availability === "in_stock"}
          onChange={() => toggleParam("availability", "in_stock")}
        />
      </FilterSection>

      <FilterSection title="Rating" active={Boolean(current.rating)}>
        <ul className="space-y-2">
          {RATING_OPTIONS.map((option) => (
            <li key={option.value}>
              <Checkbox
                label={option.label}
                checked={current.rating === option.value}
                onChange={() => toggleParam("rating", option.value)}
              />
            </li>
          ))}
        </ul>
      </FilterSection>
    </div>
  );

  return (
    <>
      <div className="mb-4 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          onClick={() => setMobileOpen(true)}
        >
          <Filter aria-hidden="true" />
          Filters
        </Button>
      </div>

      <aside className="hidden lg:block" aria-label="Product filters">
        {filtersBody}
      </aside>

      <Dialog
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title="Filters"
        description="Narrow results by category, brand, price, and more."
        className="max-w-md"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">{filtersBody}</div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setMobileOpen(false)}
          >
            <X aria-hidden="true" />
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            onClick={() => setMobileOpen(false)}
          >
            View results
          </Button>
        </div>
      </Dialog>
    </>
  );
}
