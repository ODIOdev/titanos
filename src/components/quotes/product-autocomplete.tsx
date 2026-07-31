"use client";

import * as React from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";

export type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  image_url?: string | null;
};

type SearchResponse = {
  products?: ProductSuggestion[];
  results?: ProductSuggestion[];
};

export type ProductAutocompleteProps = {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectProduct?: (product: ProductSuggestion) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  className?: string;
};

export function ProductAutocomplete({
  label = "Product name",
  required,
  error,
  hint,
  value,
  onChange,
  onSelectProduct,
  onBlur,
  name,
  id,
  className,
}: ProductAutocompleteProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-suggestions`;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<ProductSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  React.useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      React.startTransition(() => {
        setResults([]);
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setResults([]);
          return;
        }
        const data = (await response.json()) as SearchResponse;
        setResults(data.products ?? data.results ?? []);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  const showDropdown = open && value.trim().length >= 2;

  function selectProduct(product: ProductSuggestion) {
    onChange(product.name);
    onSelectProduct?.(product);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(results.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? Math.max(results.length - 1, 0) : prev - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      selectProduct(results[activeIndex]);
    }
  }

  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label ? (
        <Label htmlFor={inputId}>
          {label}
          {required ? (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-medium-gray"
          aria-hidden="true"
        />
        <input
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          required={required}
          value={value}
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          placeholder="Start typing to search products…"
          className={cn(
            "flex h-10 w-full rounded-sm border border-border-gray bg-white py-2 pl-10 pr-3 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40",
            error && "border-red-600 focus-visible:ring-red-200",
          )}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-medium-gray">
          {hint}
        </p>
      ) : null}

      {showDropdown ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-72 overflow-auto rounded-sm border border-border-gray bg-white shadow-md"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-medium-gray">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-medium-gray">
              No catalog matches. You can still enter a custom product name.
            </p>
          ) : (
            <ul className="py-1">
              {results.map((product, index) => (
                <li key={product.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-light-gray",
                      activeIndex === index && "bg-light-gray",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProduct(product)}
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-dark-charcoal">
                        {product.name}
                      </span>
                      <span className="block text-xs text-medium-gray">
                        {product.sku ? `${product.sku} · ` : ""}
                        {formatCurrency(product.price)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
