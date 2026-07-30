import { formatCurrency, cn } from "@/lib/utils";

export type PriceDisplayProps = {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export function PriceDisplay({
  price,
  compareAtPrice,
  className,
  size = "md",
}: PriceDisplayProps) {
  const onSale =
    compareAtPrice != null && compareAtPrice > price;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-sans font-bold text-dark-charcoal",
          sizeClasses[size],
        )}
      >
        {formatCurrency(price)}
      </span>
      {onSale ? (
        <span
          className={cn(
            "font-medium text-medium-gray line-through",
            size === "lg" ? "text-base" : "text-sm",
          )}
        >
          {formatCurrency(compareAtPrice)}
        </span>
      ) : null}
    </div>
  );
}
