import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined> | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value == null || value === "" || key === "page") continue;
      params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]!;
    if (i > 0 && page - sorted[i - 1]! > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }
  return result;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const items = pageWindow(current, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {current > 1 ? (
        <Link
          href={buildHref(basePath, searchParams, current - 1)}
          className="inline-flex size-10 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal transition-colors hover:bg-light-gray"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex size-10 items-center justify-center rounded-sm border border-border-gray text-medium-gray opacity-40"
          aria-disabled="true"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </span>
      )}

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex size-10 items-center justify-center text-medium-gray"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(basePath, searchParams, item)}
            aria-label={`Page ${item}`}
            aria-current={item === current ? "page" : undefined}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-sm border text-sm font-semibold transition-colors",
              item === current
                ? "border-dark-charcoal bg-dark-charcoal text-white"
                : "border-border-gray text-dark-charcoal hover:bg-light-gray",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link
          href={buildHref(basePath, searchParams, current + 1)}
          className="inline-flex size-10 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal transition-colors hover:bg-light-gray"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className="inline-flex size-10 items-center justify-center rounded-sm border border-border-gray text-medium-gray opacity-40"
          aria-disabled="true"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
