import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-sm border border-border-gray bg-white">
      <Skeleton className="aspect-square w-full rounded-none rounded-t-sm" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ count = 8, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { LoadingSkeleton, ProductCardSkeleton };
