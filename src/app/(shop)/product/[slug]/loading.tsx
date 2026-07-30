import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ProductLoading() {
  return (
    <div className="container-titan py-8 lg:py-12">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-sm" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="mt-16">
        <Skeleton className="mb-6 h-8 w-64" />
        <LoadingSkeleton count={4} />
      </div>
    </div>
  );
}
