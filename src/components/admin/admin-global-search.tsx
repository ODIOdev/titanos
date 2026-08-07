"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  Package,
  Receipt,
  Search,
  ShoppingBag,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  AdminProductPreviewDialog,
  type AdminProductPreview,
} from "@/components/admin/admin-product-preview-dialog";
import { cn } from "@/lib/utils";
import type { AdminSearchHit } from "@/app/api/admin/search/route";

const TYPE_META: Record<
  AdminSearchHit["type"],
  { label: string; icon: LucideIcon }
> = {
  product: { label: "Product", icon: Package },
  category: { label: "Category", icon: FolderTree },
  brand: { label: "Brand", icon: Tags },
  order: { label: "Order", icon: ShoppingBag },
  customer: { label: "Customer", icon: Users },
  quote: { label: "Quote", icon: Receipt },
};

const QUICK_LINKS = [
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Products/ Categories", href: "/admin/categories", icon: FolderTree },
] as const;

/** Global admin header search with live typeahead results. */
export function AdminGlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const inputId = useId();
  const listId = `${inputId}-results`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdminSearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [previewProduct, setPreviewProduct] =
    useState<AdminProductPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [, startTransition] = useTransition();

  const trimmed = query.trim();
  const showQuick = open && trimmed.length === 0;
  const showResults = open && trimmed.length > 0;

  useEffect(() => {
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

  useEffect(() => {
    if (trimmed.length < 1) {
      startTransition(() => {
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
          `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results?: AdminSearchHit[] };
        startTransition(() => {
          setResults(Array.isArray(data.results) ? data.results : []);
          setActiveIndex(-1);
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        startTransition(() => {
          setResults([]);
        });
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  function resetSearch() {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
  }

  function goTo(href: string) {
    resetSearch();
    router.push(href);
  }

  function openProductPreview(hit: AdminSearchHit) {
    if (hit.type === "product" && hit.preview) {
      resetSearch();
      setPreviewProduct(hit.preview);
      setPreviewOpen(true);
      return;
    }
    goTo(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const items = showQuick
      ? QUICK_LINKS.map((link) => ({ kind: "link" as const, href: link.href }))
      : results.map((hit) => ({ kind: "hit" as const, hit }));

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        items.length === 0 ? -1 : (prev + 1) % items.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) =>
        items.length === 0
          ? -1
          : prev <= 0
            ? items.length - 1
            : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        const item = items[activeIndex];
        if (item.kind === "hit") {
          openProductPreview(item.hit);
        } else {
          goTo(item.href);
        }
        return;
      }
      if (trimmed) {
        goTo(`/admin/products?q=${encodeURIComponent(trimmed)}`);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full min-w-[14rem] sm:w-72 sm:max-w-sm", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        Search admin
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medium-gray"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          autoComplete="off"
          placeholder="Search products, orders…"
          className={cn(
            "h-10 w-full rounded-sm border border-border-gray bg-white py-2 pr-10 pl-10 text-sm text-near-black placeholder:text-medium-gray transition-colors",
            "focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          )}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
        />
        {query ? (
          <button
            type="button"
            className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-medium-gray hover:bg-light-gray hover:text-dark-charcoal"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showQuick || showResults ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] right-0 z-50 w-full min-w-[18rem] overflow-hidden rounded-sm border border-border-gray bg-white shadow-lg sm:min-w-[22rem]"
        >
          {showQuick ? (
            <div className="p-2">
              <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-medium-gray uppercase">
                Jump to
              </p>
              <ul className="space-y-0.5">
                {QUICK_LINKS.map((link, index) => {
                  const Icon = link.icon;
                  const active = index === activeIndex;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        role="option"
                        aria-selected={active}
                        className={cn(
                          "flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm text-dark-charcoal",
                          active ? "bg-light-gray" : "hover:bg-light-gray/80",
                        )}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <Icon className="size-4 text-medium-gray" aria-hidden />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
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
                  {results.map((hit, index) => {
                    const meta = TYPE_META[hit.type];
                    const Icon = meta.icon;
                    const active = index === activeIndex;
                    const isProductPreview =
                      hit.type === "product" && Boolean(hit.preview);

                    if (isProductPreview) {
                      return (
                        <li key={`${hit.type}-${hit.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            className={cn(
                              "flex w-full items-start gap-2.5 rounded-sm px-2 py-2 text-left",
                              active
                                ? "bg-light-gray"
                                : "hover:bg-light-gray/80",
                            )}
                            onClick={() => openProductPreview(hit)}
                          >
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm bg-light-gray text-medium-gray">
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-dark-charcoal">
                                {hit.title}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-medium-gray">
                                <span className="font-semibold tracking-wide uppercase">
                                  {meta.label}
                                </span>
                                {hit.subtitle ? (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span className="truncate">
                                      {hit.subtitle}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={`${hit.type}-${hit.id}`}>
                        <Link
                          href={hit.href}
                          role="option"
                          aria-selected={active}
                          className={cn(
                            "flex items-start gap-2.5 rounded-sm px-2 py-2",
                            active ? "bg-light-gray" : "hover:bg-light-gray/80",
                          )}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                          }}
                        >
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm bg-light-gray text-medium-gray">
                            <Icon className="size-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-dark-charcoal">
                              {hit.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-medium-gray">
                              <span className="font-semibold tracking-wide uppercase">
                                {meta.label}
                              </span>
                              {hit.subtitle ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="truncate">{hit.subtitle}</span>
                                </>
                              ) : null}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <AdminProductPreviewDialog
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
