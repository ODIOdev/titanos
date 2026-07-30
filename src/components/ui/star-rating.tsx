import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  rating: number;
  max?: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
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
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(rating, max));
  const starSize = sizeMap[size];

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`${clamped.toFixed(1)} out of ${max} stars${count != null ? `, ${count} reviews` : ""}`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: max }).map((_, index) => {
          const fill = Math.min(1, Math.max(0, clamped - index));
          return (
            <span key={index} className="relative inline-flex">
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
