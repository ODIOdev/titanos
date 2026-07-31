import { cn } from "@/lib/utils";

/** Mirrors ProductCard's proportions so streamed results don't shift layout. */
export function ProductGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex h-full animate-pulse flex-col overflow-hidden rounded-sm border border-border-gray bg-white"
        >
          <div className="aspect-square bg-light-gray" />
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            <div className="h-3.5 w-11/12 rounded-sm bg-light-gray" />
            <div className="h-3.5 w-2/3 rounded-sm bg-light-gray" />
            <div className="h-3 w-20 rounded-sm bg-light-gray" />
            <div className="mt-1 h-5 w-24 rounded-sm bg-light-gray" />
            <div className="mt-auto h-9 w-full rounded-sm bg-light-gray" />
          </div>
        </div>
      ))}
    </div>
  );
}
