"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArchiveRestore, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { restoreBrand } from "@/lib/actions/admin";
import type { AdminBrandRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";

export function BrandsArchivesCard({ brands }: { brands: AdminBrandRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRestore(brandId: string, brandName: string) {
    startTransition(async () => {
      const result = await restoreBrand(brandId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(`${brandName} restored.`);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-gray bg-light-gray/40 px-4 py-3 @5xl:px-5 @5xl:py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-amber-100 text-amber-800">
            <ArchiveRestore className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
              Archives
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Brands with no products stay here. Assign a brand on a product to
              activate it on the homepage.
            </p>
          </div>
        </div>
        <Badge variant="default" className="tabular-nums">
          {brands.length} archived
        </Badge>
      </div>

      {brands.length === 0 ? (
        <p className="px-4 py-6 text-sm text-medium-gray @5xl:px-5">
          No archived brands. Use the archive icon on an active brand to move it
          here.
        </p>
      ) : (
        <ul className="divide-y divide-border-gray">
          {brands.map((brand) => (
            <li
              key={brand.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 @5xl:px-5"
            >
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-sm border border-border-gray bg-white p-1">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt=""
                    width={48}
                    height={28}
                    unoptimized
                    className="max-h-7 w-auto object-contain"
                  />
                ) : (
                  <span className="text-[0.65rem] text-medium-gray">—</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/brands/${brand.id}`}
                  className="font-medium text-dark-charcoal hover:text-titan-yellow"
                >
                  {brand.name}
                </Link>
                <p className="truncate text-xs text-medium-gray">
                  {brand.slug} · {brand.productCount} product
                  {brand.productCount === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRestore(brand.id, brand.name)}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-gray bg-white px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
