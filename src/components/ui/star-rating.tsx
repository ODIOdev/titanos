"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  rating: number;
  max?: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  /** When true, stars are buttons the user can click to set a rating. */
  interactive?: boolean;
  /** Controlled value while picking (falls back to `rating`). */
  value?: number;
  disabled?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

function StarRating({
  rating,
  max = 5,
  count,
  size = "md",
  showValue = false,
  className,
  interactive = false,
  value,
  disabled = false,
  onChange,
}: StarRatingProps) {
  const display = value ?? rating;
  const clamped = Math.max(0, Math.min(display, max));
  const starSize = sizeMap[size];

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={
        interactive
          ? `Rate ${clamped || 0} out of ${max} stars`
          : `${clamped.toFixed(1)} out of ${max} stars${count != null ? `, ${count} reviews` : ""}`
      }
    >
      <div className="flex items-center gap-0.5" aria-hidden={!interactive}>
        {Array.from({ length: max }).map((_, index) => {
          const fill = Math.min(1, Math.max(0, clamped - index));
          const starValue = index + 1;
          const star = (
            <span className="relative inline-flex">
              <Star className={cn(starSize, "text-border-gray")} />
              {fill > 0 ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={cn(starSize, "fill-titan-yellow text-titan-yellow")}
                  />
                </span>
              ) : null}
            </span>
          );

          if (!interactive) {
            return <span key={index}>{star}</span>;
          }

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
              aria-pressed={clamped >= starValue}
              className={cn(
                "rounded-sm p-0.5 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow disabled:opacity-60",
              )}
              onClick={() => onChange?.(starValue)}
            >
              {star}
            </button>
          );
        })}
      </div>
      {showValue ? (
        <span className="text-sm font-medium text-dark-charcoal">
          {clamped.toFixed(1)}
        </span>
      ) : null}
      {count != null ? (
        <span className="text-sm text-medium-gray">({count})</span>
      ) : null}
    </div>
  );
}

export { StarRating };
