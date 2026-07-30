import type { Metadata } from "next";
import { ShopCatalog } from "@/components/products/shop-catalog";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop Safety Equipment",
  description: `Browse hard hats, safety vests, work boots, traffic control, and PPE from ${SITE_CONFIG.name}.`,
  alternates: {
    canonical: absoluteUrl("/shop"),
  },
  openGraph: {
    title: `Shop Safety Equipment | ${SITE_CONFIG.name}`,
    description: SITE_CONFIG.description,
    url: absoluteUrl("/shop"),
  },
};

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  return (
    <ShopCatalog
      searchParams={params}
      title={q ? `Results for “${q}”` : "Shop All Products"}
      description={
        q
          ? `Showing products matching “${q}”.`
          : "Professional safety gear, reflective workwear, and traffic-control equipment ready to ship."
      }
      basePath="/shop"
    />
  );
}
