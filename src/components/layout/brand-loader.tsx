import Image from "next/image";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export type BrandLoaderProps = {
  /** Announced to screen readers and shown under the mark. */
  label?: string;
  tone?: "dark" | "light";
  className?: string;
};

/** Animated logo mark used by the site preloader and every route fallback. */
export function BrandLoader({
  label = "Loading",
  tone = "light",
  className,
}: BrandLoaderProps) {
  const onDark = tone === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-5", className)}
    >
      <div className="relative flex size-28 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 animate-spin rounded-full border-2",
            onDark
              ? "border-white/15 border-t-titan-yellow"
              : "border-border-gray border-t-titan-yellow",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "animate-loader-pulse flex size-20 items-center justify-center rounded-full",
            // The shield outline is charcoal, so it needs a light plate on dark.
            onDark ? "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.45)]" : "bg-white",
          )}
        >
          <Image
            src="/images/logo/logo-badge.webp"
            alt={SITE_CONFIG.name}
            width={226}
            height={257}
            priority
            className="h-11 w-auto object-contain"
          />
        </span>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <p
          className={cn(
            "font-heading text-xs font-semibold uppercase tracking-[0.28em]",
            onDark ? "text-titan-yellow" : "text-medium-gray",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "relative block h-0.5 w-32 overflow-hidden rounded-full",
            onDark ? "bg-white/15" : "bg-border-gray",
          )}
          aria-hidden="true"
        >
          <span className="animate-loader-sweep absolute inset-y-0 left-0 w-1/3 rounded-full bg-titan-yellow" />
        </span>
      </div>
    </div>
  );
}

/** Centered fallback for `loading.tsx` route segments. */
export function RouteLoader({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] w-full items-center justify-center px-6 py-16",
        className,
      )}
    >
      <BrandLoader label={label} />
    </div>
  );
}
