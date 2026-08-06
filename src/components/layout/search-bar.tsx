"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search, X } from "lucide-react";
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
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchProduct[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    React.startTransition(() => {
      setRecent(readRecentSearches());
    });
  }, []);

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
    const trimmed = query.trim();
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
          { signal: controller.signal }
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
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const showRecent = open && query.trim().length < 2 && recent.length > 0;
  const showResults = open && query.trim().length >= 2;
  const optionCount = showRecent
    ? recent.length
    : showResults
      ? results.length + 1
      : 0;

  function goToSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    writeRecentSearch(trimmed);
    setRecent(readRecentSearches());
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  function goToProduct(slug: string) {
    writeRecentSearch(query);
    setRecent(readRecentSearches());
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(`/product/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(optionCount, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? Math.max(optionCount - 1, 0) : prev - 1
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
          goToProduct(results[activeIndex].slug);
          return;
        }
      }
      goToSearch(query);
    }
  }

  const isOnDark = variant === "onDark";
  const isLarge = size === "lg";
  const suggestionsId = `${inputId}-suggestions`;

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
                inputRef.current?.focus();
              }}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {(showRecent || showResults) && (
        <div
          id={suggestionsId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-sm border border-border-gray bg-white shadow-md"
        >
          {showRecent ? (
            <div className="py-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-medium-gray">
                Recent searches
              </p>
              {recent.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-charcoal hover:bg-light-gray",
                    activeIndex === index && "bg-light-gray"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToSearch(item)}
                >
                  <Clock className="size-3.5 text-medium-gray" aria-hidden="true" />
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          {showResults ? (
            <div className="py-2">
              {loading ? (
                <p className="px-3 py-3 text-sm text-medium-gray">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-medium-gray">
                  No products found for “{query.trim()}”
                </p>
              ) : (
                <>
                  {results.slice(0, 6).map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-light-gray",
                        activeIndex === index && "bg-light-gray"
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goToProduct(product.slug)}
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
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
                  ))}
                  <Link
                    href={`/shop?q=${encodeURIComponent(query.trim())}`}
                    role="option"
                    aria-selected={activeIndex === results.length}
                    className={cn(
                      "block border-t border-border-gray px-3 py-2.5 text-sm font-semibold text-dark-charcoal hover:bg-light-gray",
                      activeIndex === results.length && "bg-light-gray"
                    )}
                    onMouseEnter={() => setActiveIndex(results.length)}
                    onClick={() => {
                      writeRecentSearch(query);
                      setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    View all results for “{query.trim()}”
                  </Link>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
