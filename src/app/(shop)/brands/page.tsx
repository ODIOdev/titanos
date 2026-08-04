import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBrands } from "@/lib/data/products";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Brands",
  description: `Shop trusted safety brands at ${SITE_CONFIG.name}.`,
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="container-titan py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Brands
      </h1>
      <p className="mt-4 max-w-2xl text-medium-gray">
        {SITE_CONFIG.brandNote} Explore manufacturers we commonly stock for jobsites and
        municipal fleets.
      </p>

      {brands.length === 0 ? (
        <p className="mt-10 rounded-sm border border-border-gray bg-white px-5 py-10 text-center text-sm text-medium-gray">
          Brand logos will appear here once they are uploaded in admin.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/shop?brand=${brand.slug}`}
              className="group flex flex-col overflow-hidden rounded-sm border border-border-gray bg-white transition-colors hover:border-dark-charcoal"
            >
              <div className="relative flex h-36 items-center justify-center bg-transparent p-6">
                <Image
                  src={brand.logo_url!}
                  alt={`${brand.name} logo`}
                  width={200}
                  height={80}
                  className="max-h-16 w-auto bg-transparent object-contain [mix-blend-mode:multiply]"
                  unoptimized
                />
              </div>
              <div className="border-t border-border-gray p-5">
                <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal group-hover:underline group-hover:underline-offset-2">
                  {brand.name}
                </h2>
                {brand.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-medium-gray">
                    {brand.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
