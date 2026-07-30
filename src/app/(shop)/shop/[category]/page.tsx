import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopCatalog } from "@/components/products/shop-catalog";
import { getCategoryBySlug } from "@/lib/data/products";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { absoluteUrl } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category Not Found" };
  }

  const title = category.name;
  const description =
    category.description ??
    `Shop ${category.name} from ${SITE_CONFIG.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/shop/${category.slug}`),
    },
    openGraph: {
      title: `${category.name} | ${SITE_CONFIG.name}`,
      description,
      url: absoluteUrl(`/shop/${category.slug}`),
    },
  };
}

export default async function CategoryShopPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category: slug }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <ShopCatalog
      searchParams={query}
      categorySlug={category.slug}
      title={category.name}
      description={
        category.description ??
        `Browse ${category.name} built for jobsites and compliance.`
      }
      basePath={`/shop/${category.slug}`}
      breadcrumbLabel={category.name}
    />
  );
}
