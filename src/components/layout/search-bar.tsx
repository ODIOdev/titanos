"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Package, Search, X } from "lucide-react";
import {
  ProductPreviewDialog,
  type StorefrontProductPreview,
} from "@/components/products/product-preview-dialog";
import { cn, formatCurrency } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "titan-recent-searches";
const MAX_RECENT = 6;

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  image_url?: string | null;
  preview?: StorefrontProductPreview;
};

type SearchResponse = {
  products?: SearchProduct[];
  results?: SearchProduct[];
};

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const next = [
    trimmed,
    ...readRecentSearches().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export interface SearchBarProps {
  className?: string;
  inputClassName?: string;
  inputId?: string;
  variant?: "default" | "onDark";
  size?: "md" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export function SearchBar({
  className,
  inputClassName,
  inputId = "site-search",
  variant = "default",
  size = "md",
  placeholder = "Search safety gear, boots, signs…",
  autoFocus,
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchProduct[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [previewProduct, setPreviewProduct] =
    React.useState<StorefrontProductPreview | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    width: 0,
    zIndex: 70,
    visibility: "hidden",
  });

  const trimmed = query.trim();
  const showRecent = open && trimmed.length < 1 && recent.length > 0;
  const showIdle = open && trimmed.length < 1 && recent.length === 0;
  const showResults = open && trimmed.length >= 1;
  const panelVisible = showRecent || showIdle || showResults;

  React.useEffect(() => {
    setMounted(true);
    React.startTransition(() => {
      setRecent(readRecentSearches());
    });
  }, []);

  React.useEffect(() => {
    if (!panelVisible) return;

    function updatePanelPosition() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(rect.width, 288);
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - width - 8,
      );
      const top = rect.bottom + 6;

      setPanelStyle((prev) => {
        if (
          prev.top === top &&
          prev.left === left &&
          prev.width === width &&
          prev.visibility === "visible"
        ) {
          return prev;
        }
        return {
          position: "fixed",
          top,
          left,
          width,
          zIndex: 70,
          visibility: "visible",
        };
      });
    }

    updatePanelPosition();

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [panelVisible]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  React.useEffect(() => {
    if (trimmed.length < 1) {
      React.startTransition(() => {
        setResults([]);
        setLoading(false);
        setActiveIndex(-1);
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
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  const optionCount = showRecent
    ? recent.length
    : showResults
      ? results.length + (results.length > 0 ? 1 : 0)
      : 0;

  function goToSearch(value: string) {
    const next = value.trim();
    if (!next) return;
    writeRecentSearch(next);
    setRecent(readRecentSearches());
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(`/shop?q=${encodeURIComponent(next)}`);
  }

  function openProductPreview(product: SearchProduct) {
    writeRecentSearch(query);
    setRecent(readRecentSearches());
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();

    if (product.preview) {
      setPreviewProduct(product.preview);
      setPreviewOpen(true);
      return;
    }

    router.push(`/product/${product.slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (optionCount === 0) return;
      setActiveIndex((prev) => (prev + 1) % optionCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (optionCount === 0) return;
      setActiveIndex((prev) =>
        prev <= 0 ? optionCount - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (showRecent && activeIndex >= 0 && recent[activeIndex]) {
        goToSearch(recent[activeIndex]);
        return;
      }
      if (showResults && activeIndex >= 0) {
        if (activeIndex < results.length) {
          openProductPreview(results[activeIndex]);
          return;
        }
      }
      goToSearch(query);
    }
  }

  const isOnDark = variant === "onDark";
  const isLarge = size === "lg";
  const suggestionsId = `${inputId}-suggestions`;

  const panel = panelVisible ? (
    <div
      ref={panelRef}
      id={suggestionsId}
      role="listbox"
      style={panelStyle}
      className="overflow-hidden rounded-sm border border-border-gray bg-white shadow-lg"
    >
      {showIdle ? (
        <p className="px-3 py-3 text-sm text-medium-gray">
          Start typing to search products…
        </p>
      ) : null}

      {showRecent ? (
        <div className="p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-medium-gray uppercase">
            Recent searches
          </p>
          <ul className="space-y-0.5">
            {recent.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-sm text-dark-charcoal",
                    activeIndex === index
                      ? "bg-light-gray"
                      : "hover:bg-light-gray/80",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToSearch(item)}
                >
                  <Clock
                    className="size-4 shrink-0 text-medium-gray"
                    aria-hidden="true"
                  />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showResults ? (
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {loading && results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-medium-gray">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-medium-gray">
              No matches for “{trimmed}”.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.slice(0, 8).map((product, index) => (
                <li key={product.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-sm px-2 py-2 text-left",
                      activeIndex === index
                        ? "bg-light-gray"
                        : "hover:bg-light-gray/80",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openProductPreview(product)}
                  >
                    <span className="relative mt-0.5 size-9 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-medium-gray">
                          <Package className="size-3.5" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-dark-charcoal">
                        {product.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-medium-gray">
                        <span className="font-semibold tracking-wide uppercase">
                          Product
                        </span>
                        <span aria-hidden>·</span>
                        <span className="truncate">
                          {product.sku
                            ? `SKU ${product.sku} · ${formatCurrency(product.price)}`
                            : formatCurrency(product.price)}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href={`/shop?q=${encodeURIComponent(trimmed)}`}
                  role="option"
                  aria-selected={activeIndex === results.length}
                  className={cn(
                    "mt-0.5 flex items-center rounded-sm border-t border-border-gray px-2 py-2.5 text-sm font-semibold text-dark-charcoal",
                    activeIndex === results.length
                      ? "bg-light-gray"
                      : "hover:bg-light-gray/80",
                  )}
                  onMouseEnter={() => setActiveIndex(results.length)}
                  onClick={() => {
                    writeRecentSearch(query);
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  View all results for “{trimmed}”
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          goToSearch(query);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2",
              isLarge ? "left-3.5 size-4" : "left-3 size-4",
              isOnDark
                ? isLarge
                  ? "text-dark-charcoal"
                  : "text-titan-yellow"
                : "text-medium-gray",
            )}
            strokeWidth={isLarge ? 2.25 : 2}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder={placeholder}
            className={cn(
              "w-full rounded-sm border py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40",
              "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
              isLarge ? "h-11 pl-10 pr-10 text-sm" : "h-10 pl-10 pr-10 text-sm",
              isOnDark
                ? cn(
                    "border border-white/25 bg-near-black/70 text-white placeholder:text-white/55 backdrop-blur-sm focus-visible:border-titan-yellow",
                    isLarge &&
                      "border-titan-yellow bg-[#f3f4f5] text-near-black placeholder:text-medium-gray focus-visible:ring-titan-yellow/50",
                    !isLarge && "h-12",
                  )
                : "border-border-gray bg-white text-near-black placeholder:text-medium-gray focus-visible:border-dark-charcoal",
              inputClassName,
            )}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            aria-expanded={open}
            aria-controls={suggestionsId}
            aria-autocomplete="list"
            role="combobox"
          />
          {query ? (
            <button
              type="button"
              className={cn(
                "absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-sm",
                isLarge ? "right-2 size-7" : "right-2 size-6",
                isOnDark
                  ? isLarge
                    ? "text-medium-gray hover:bg-black/5 hover:text-dark-charcoal"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-medium-gray hover:bg-light-gray hover:text-dark-charcoal",
              )}
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setResults([]);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {mounted && panel ? createPortal(panel, document.body) : null}

      <ProductPreviewDialog
        product={previewProduct}
        open={previewOpen}
        onOpenChange={(next) => {
          setPreviewOpen(next);
          if (!next) setPreviewProduct(null);
        }}
      />
    </div>
  );
}
