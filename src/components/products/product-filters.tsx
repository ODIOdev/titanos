"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "@/components/shared/color-swatch";
import { groupCatalogSizes } from "@/lib/data/catalog-options";

/** Mount target above the department rail on the shop catalog. */
export const SHOP_FILTERS_MOBILE_ROOT_ID = "shop-filters-mobile-root";

export type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

export type ProductFiltersProps = {
  categories?: FilterOption[];
  brands?: FilterOption[];
  departments?: FilterOption[];
  genders?: FilterOption[];
  ansiClasses?: FilterOption[];
  materials?: FilterOption[];
  colors?: FilterOption[];
  sizes?: FilterOption[];
  className?: string;
  priceBounds?: { min: number; max: number };
  /** Applied filter count, shown on the mobile trigger. */
  activeCount?: number;
};

const RATING_OPTIONS = [
  { label: "4 stars & up", value: "4" },
  { label: "3 stars & up", value: "3" },
  { label: "2 stars & up", value: "2" },
] as const;

function formatDollar(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Dual-thumb dollar range slider for the shop price filter. */
function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onCommit,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onCommit: (nextMin: number, nextMax: number) => void;
}) {
  const span = Math.max(1, max - min);
  const [draftMin, setDraftMin] = useState(valueMin);
  const [draftMax, setDraftMax] = useState(valueMax);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftMin(valueMin);
    setDraftMax(valueMax);
  }, [valueMin, valueMax]);

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, []);

  function scheduleCommit(nextMin: number, nextMax: number) {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      onCommit(nextMin, nextMax);
    }, 120);
  }

  function updateMin(raw: number) {
    const nextMin = Math.min(raw, draftMax);
    setDraftMin(nextMin);
    scheduleCommit(nextMin, draftMax);
  }

  function updateMax(raw: number) {
    const nextMax = Math.max(raw, draftMin);
    setDraftMax(nextMax);
    scheduleCommit(draftMin, nextMax);
  }

  const leftPct = ((draftMin - min) / span) * 100;
  const rightPct = ((draftMax - min) / span) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-sm tabular-nums text-dark-charcoal">
        <span className="font-semibold">{formatDollar(draftMin)}</span>
        <span className="text-medium-gray">–</span>
        <span className="font-semibold">{formatDollar(draftMax)}</span>
      </div>

      <div className="relative h-8">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border-gray" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-titan-yellow"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={draftMin}
          aria-label="Minimum price"
          onChange={(event) => updateMin(Number(event.target.value))}
          className="price-range-thumb absolute inset-0 z-[2] w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={draftMax}
          aria-label="Maximum price"
          onChange={(event) => updateMax(Number(event.target.value))}
          className="price-range-thumb absolute inset-0 z-[3] w-full appearance-none bg-transparent"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-medium-gray">
        <span>{formatDollar(min)}</span>
        <span>{formatDollar(max)}</span>
      </div>
    </div>
  );
}

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
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={sectionRef}
      className="scroll-mt-3 border-b border-border-gray pb-3 last:border-b-0"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 overflow-visible py-2.5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              // Keep the section title in view after expand in the sticky / mobile scrollers.
              requestAnimationFrame(() => {
                sectionRef.current?.scrollIntoView({
                  block: "nearest",
                  behavior: "smooth",
                });
              });
            }
            return next;
          });
        }}
      >
        <span className="min-w-0 font-heading text-sm uppercase leading-normal tracking-wide text-dark-charcoal">
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
        className={cn("space-y-3 pb-3", open && "pt-1.5")}
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
  showColorSwatch = false,
}: {
  options: FilterOption[];
  paramKey: string;
  selected: string | null;
  onToggle: (key: string, value: string) => void;
  showColorSwatch?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {options.map((option) => {
        const checked = selected === option.value;
        const text =
          option.count != null
            ? `${option.label} (${option.count})`
            : option.label;
        return (
          <li key={option.value}>
            <Checkbox
              label={
                showColorSwatch ? (
                  <span className="inline-flex items-center gap-2">
                    <ColorSwatch color={option.value} />
                    <span>{text}</span>
                  </span>
                ) : (
                  text
                )
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

function SizePartition({
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
    <div className="rounded-sm border border-border-gray/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 overflow-visible px-2.5 py-2.5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-[11px] font-semibold uppercase leading-normal tracking-[0.14em] text-medium-gray">
          {title}
          {active ? (
            <span className="ml-2 inline-block size-1.5 rounded-full bg-titan-yellow align-middle" />
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-medium-gray transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} hidden={!open} className={cn(open && "px-2.5 pb-2.5")}>
        {open ? children : null}
      </div>
    </div>
  );
}

function GroupedSizeOptions({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string | null;
  onToggle: (key: string, value: string) => void;
}) {
  const groups = groupCatalogSizes(options);
  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const active = Boolean(
          selected &&
            group.options.some((option) => option.value === selected),
        );
        return (
          <SizePartition
            key={group.id}
            title={group.title}
            active={active}
            defaultOpen={active}
          >
            <OptionList
              options={group.options}
              paramKey="size"
              selected={selected}
              onToggle={onToggle}
            />
          </SizePartition>
        );
      })}
    </div>
  );
}

export function ProductFilters({
  categories = [],
  brands = [],
  departments = [],
  genders = [],
  ansiClasses = [],
  materials = [],
  colors = [],
  sizes = [],
  className,
  priceBounds = { min: 0, max: 200 },
  activeCount = 0,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [syncedQuery, setSyncedQuery] = useState(searchParams.get("q") ?? "");
  const [pushedQuery, setPushedQuery] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileRoot = useShopFiltersMobileRoot();

  const current = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      department: searchParams.get("department") ?? searchParams.get("group"),
      category: searchParams.get("category"),
      brand: searchParams.get("brand"),
      gender: searchParams.get("gender"),
      touchScreen: searchParams.get("touchScreen"),
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      ansiClass: searchParams.get("ansiClass"),
      material: searchParams.get("material"),
      color: searchParams.get("color"),
      size: searchParams.get("size"),
      availability: searchParams.get("availability"),
      rating: searchParams.get("rating"),
    }),
    [searchParams],
  );

  // Adopt the URL's search term when something else changes it (filter chips,
  // clear all), while ignoring the value this component just pushed so a slow
  // route update can't clobber characters typed since the debounce fired.
  if (current.q !== syncedQuery) {
    setSyncedQuery(current.q);
    if (current.q !== pushedQuery) setQuery(current.q);
  }

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const next = params.toString();
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (query === current.q) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = query.trim();
      setPushedQuery(trimmed);
      updateParams((params) => {
        if (!trimmed) params.delete("q");
        else params.set("q", trimmed);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, current.q, updateParams]);

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

  const setPriceRange = useCallback(
    (nextMin: number, nextMax: number) => {
      updateParams((params) => {
        const min = Math.max(priceBounds.min, Math.min(nextMin, nextMax));
        const max = Math.min(priceBounds.max, Math.max(nextMin, nextMax));
        if (min <= priceBounds.min) params.delete("minPrice");
        else params.set("minPrice", String(Math.round(min)));
        if (max >= priceBounds.max) params.delete("maxPrice");
        else params.set("maxPrice", String(Math.round(max)));
      });
    },
    [priceBounds.max, priceBounds.min, updateParams],
  );

  const clearAll = useCallback(() => {
    setQuery("");
    setPushedQuery("");
    updateParams((params) => {
      [
        "q",
        "department",
        "group",
        "category",
        "brand",
        "gender",
        "touchScreen",
        "minPrice",
        "maxPrice",
        "productType",
        "ansiClass",
        "material",
        "color",
        "size",
        "availability",
        "rating",
      ].forEach((key) => params.delete(key));
    });
  }, [updateParams]);

  const priceActive = Boolean(current.minPrice || current.maxPrice);
  const urlMinPrice = current.minPrice
    ? Number(current.minPrice)
    : priceBounds.min;
  const urlMaxPrice = current.maxPrice
    ? Number(current.maxPrice)
    : priceBounds.max;

  const filtersBody = (
    <div
      className={cn("space-y-0.5", isPending && "opacity-70", className)}
      aria-busy={isPending}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-gray pb-4">
        <h2 className="flex items-center gap-2 font-heading text-lg uppercase leading-normal tracking-wide text-dark-charcoal">
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-sm bg-titan-yellow px-1.5 text-xs font-semibold tabular-nums text-near-black">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FilterSection title="Search" active={Boolean(current.q)} defaultOpen>
        <Input
          name="q"
          type="search"
          placeholder="name, SKU, brand, category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
          aria-busy={isPending || undefined}
        />
      </FilterSection>

      {departments.length > 0 ? (
        <FilterSection
          title="Department"
          active={Boolean(current.department)}
        >
          <OptionList
            options={departments}
            paramKey="department"
            selected={current.department}
            onToggle={(key, value) => {
              updateParams((params) => {
                params.delete("group");
                if (params.get(key) === value) {
                  params.delete(key);
                } else {
                  params.set(key, value);
                }
              });
            }}
          />
        </FilterSection>
      ) : null}

      {categories.length > 0 ? (
        <FilterSection
          title="Category"
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

      {genders.length > 0 ? (
        <FilterSection title="Gender" active={Boolean(current.gender)}>
          <OptionList
            options={genders}
            paramKey="gender"
            selected={current.gender}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      <FilterSection
        title="Touch screen"
        active={Boolean(current.touchScreen)}
      >
        <OptionList
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          paramKey="touchScreen"
          selected={current.touchScreen}
          onToggle={toggleParam}
        />
      </FilterSection>

      <FilterSection title="Price" active={priceActive}>
        <PriceRangeSlider
          min={priceBounds.min}
          max={priceBounds.max}
          valueMin={
            Number.isFinite(urlMinPrice) ? urlMinPrice : priceBounds.min
          }
          valueMax={
            Number.isFinite(urlMaxPrice) ? urlMaxPrice : priceBounds.max
          }
          onCommit={setPriceRange}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="min-price" className="sr-only">
              Minimum price
            </Label>
            <Input
              id="min-price"
              type="number"
              min={priceBounds.min}
              max={priceBounds.max}
              prefix="$"
              placeholder={String(priceBounds.min)}
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
              prefix="$"
              placeholder={String(priceBounds.max)}
              value={current.maxPrice}
              onChange={(event) => setPrice("maxPrice", event.target.value)}
            />
          </div>
        </div>
      </FilterSection>

      {ansiClasses.length > 0 ? (
        <FilterSection
          title="Additional ANSI certification"
          active={Boolean(current.ansiClass)}
        >
          <OptionList
            options={ansiClasses}
            paramKey="ansiClass"
            selected={current.ansiClass}
            onToggle={toggleParam}
          />
        </FilterSection>
      ) : null}

      {materials.length > 0 ? (
        <FilterSection title="Materials" active={Boolean(current.material)}>
          <OptionList
            options={materials}
            paramKey="material"
            selected={current.material}
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
            showColorSwatch
          />
        </FilterSection>
      ) : null}

      {sizes.length > 0 ? (
        <FilterSection title="Size" active={Boolean(current.size)}>
          <GroupedSizeOptions
            options={sizes}
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

  const mobileFilters = (
    <div className="shop-filters-mobile">
      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full justify-between"
        aria-expanded={mobileOpen}
        aria-controls="shop-filters-panel"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="inline-flex items-center gap-2">
          <Filter aria-hidden="true" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-sm bg-titan-yellow px-1.5 text-xs font-semibold tabular-nums text-near-black">
              {activeCount}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-medium-gray transition-transform duration-200",
            mobileOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Button>

      {mobileOpen ? (
        <div
          id="shop-filters-panel"
          className="mt-3 overflow-hidden rounded-sm border border-border-gray bg-white"
        >
          <div className="max-h-[min(75dvh,32rem)] overflow-y-auto overscroll-contain scroll-pt-2 px-3 py-3 [scrollbar-gutter:stable]">
            {filtersBody}
          </div>
          <div className="flex gap-2 border-t border-border-gray bg-white p-3">
            {activeCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={clearAll}
              >
                Clear all
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={() => setMobileOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {mobileRoot ? createPortal(mobileFilters, mobileRoot) : null}
      <aside
        className="shop-filters-desktop hidden @5xl:sticky @5xl:top-20 @5xl:block @5xl:max-h-[calc(100vh-6rem)] @5xl:self-start @5xl:overflow-y-auto @5xl:overscroll-contain @5xl:scroll-pt-2 @5xl:pr-1 @5xl:pb-4 [scrollbar-gutter:stable]"
        aria-label="Product filters"
      >
        {filtersBody}
      </aside>
    </>
  );
}

function useShopFiltersMobileRoot() {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setRoot(document.getElementById(SHOP_FILTERS_MOBILE_ROOT_ID));
  }, []);

  return root;
}
