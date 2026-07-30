import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ShopLoading() {
  return (
    <div className="container-titan py-8 lg:py-12">
      <div className="mb-8 h-10 w-64 animate-pulse rounded-sm bg-light-gray" />
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="hidden h-96 animate-pulse rounded-sm bg-light-gray lg:block" />
        <LoadingSkeleton count={12} />
      </div>
    </div>
  );
}
