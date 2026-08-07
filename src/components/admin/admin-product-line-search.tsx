"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Package, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminProductLineOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
};

type AdminProductLineSearchProps = {
  products: AdminProductLineOption[];
  value: string;
  onSelect: (productId: string) => void;
  label?: string;
};

function scoreProduct(product: AdminProductLineOption, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return 1;
  const name = product.name.toLowerCase();
  const sku = product.sku.toLowerCase();
  let score = 0;
  if (sku === query) score = Math.max(score, 100);
  else if (sku.startsWith(query)) score = Math.max(score, 90);
  else if (sku.includes(query)) score = Math.max(score, 80);
  if (name === query) score = Math.max(score, 95);
  else if (name.startsWith(query)) score = Math.max(score, 85);
  else if (name.includes(query)) score = Math.max(score, 70);
  return score;
}

/** Typeahead catalog picker for admin order line items. */
export function AdminProductLineSearch({
  products,
  value,
  onSelect,
  label = "Catalog product",
}: AdminProductLineSearchProps) {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = products.find((product) => product.id === value) ?? null;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    const ranked = products
      .map((product) => ({ product, score: scoreProduct(product, query) }))
      .filter((row) => row.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.product.name.localeCompare(b.product.name),
      )
      .slice(0, 8)
      .map((row) => row.product);
    return ranked;
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function choose(productId: string) {
    onSelect(productId);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearSelection() {
    onSelect("");
    setQuery("");
    setOpen(true);
    queueMicrotask(() => inputRef.current?.focus());
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <Label htmlFor={inputId}>{label}</Label>
      {selected && !open ? (
        <div className="mt-0 flex h-10 items-center gap-2 rounded-sm border border-border-gray bg-white px-2.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-titan-yellow/70 text-near-black">
            <Package className="size-3.5" aria-hidden="true" />
          </span>
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm text-dark-charcoal"
            onClick={() => {
              setQuery(selected.name);
              setOpen(true);
              queueMicrotask(() => inputRef.current?.focus());
            }}
          >
            <span className="font-medium">{selected.name}</span>
            <span className="text-medium-gray">
              {" "}
              · {selected.sku} · {formatCurrency(selected.price)}
            </span>
          </button>
          <button
            type="button"
            aria-label="Clear catalog product"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-medium-gray hover:bg-light-gray hover:text-dark-charcoal"
            onClick={clearSelection}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="relative mt-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-medium-gray"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Search name or SKU…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setHighlight((prev) =>
                  Math.min(prev + 1, Math.max(0, matches.length)),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && open) {
                event.preventDefault();
                if (highlight === 0) {
                  choose("");
                  return;
                }
                const product = matches[highlight - 1];
                if (product) choose(product.id);
              }
            }}
            className="flex h-10 w-full rounded-sm border border-border-gray bg-white py-2 pl-9 pr-3 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
          />
        </div>
      )}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
        >
          <li role="option" aria-selected={highlight === 0}>
            <button
              type="button"
              className={cn(
                "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                highlight === 0
                  ? "bg-titan-yellow/20 text-dark-charcoal"
                  : "text-dark-charcoal hover:bg-light-gray/70",
              )}
              onMouseEnter={() => setHighlight(0)}
              onClick={() => choose("")}
            >
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-light-gray text-medium-gray">
                <X className="size-3.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium">Custom line</span>
                <span className="block text-xs text-medium-gray">
                  No catalog SKU — enter name and price below
                </span>
              </span>
            </button>
          </li>
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-medium-gray">
              No products match “{query.trim()}”
            </li>
          ) : (
            matches.map((product, index) => {
              const optionIndex = index + 1;
              const active = highlight === optionIndex;
              return (
                <li
                  key={product.id}
                  role="option"
                  aria-selected={active}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-titan-yellow/20 text-dark-charcoal"
                        : "hover:bg-light-gray/70",
                      value === product.id && "font-medium",
                    )}
                    onMouseEnter={() => setHighlight(optionIndex)}
                    onClick={() => choose(product.id)}
                  >
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-titan-yellow/50 text-near-black">
                      <Package className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-dark-charcoal">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-medium-gray">
                        {product.sku} · {formatCurrency(product.price)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
      <p className="mt-1.5 text-xs text-medium-gray">
        Type to find catalog products, or choose Custom line.
      </p>
    </div>
  );
}
