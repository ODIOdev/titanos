import { CategoryCard } from "@/components/home/category-card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  HOMEPAGE_CATEGORY_SLUGS,
  SEED_CATEGORIES,
} from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const DISPLAY_NAMES: Record<string, string> = {
  "hard-hats": "Hard Hats",
  "safety-vests": "Safety Vests",
  "work-boots": "Work Boots",
  "traffic-cones": "Traffic Control",
  "street-signs": "Street Signs",
  barricades: "Barricades",
};

export type CategoryGridProps = {
  className?: string;
};

export function CategoryGrid({ className }: CategoryGridProps) {
  const categories = HOMEPAGE_CATEGORY_SLUGS.map((slug) => {
    const seed = SEED_CATEGORIES.find((c) => c.slug === slug);
    return {
      slug,
      name: DISPLAY_NAMES[slug] ?? seed?.name ?? slug,
      imageUrl: seed?.image_url ?? `/images/categories/${slug}.svg`,
      href: `/shop/${slug}`,
    };
  });

  return (
    <section
      className={cn("section-y bg-white", className)}
      aria-labelledby="shop-by-category-heading"
    >
      <div className="container-titan">
        <SectionHeader
          eyebrow="Browse catalog"
          title="Shop by category"
          titleId="shop-by-category-heading"
          href="/shop"
          linkLabel="View all"
        />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => (
            <li key={category.slug}>
              <CategoryCard
                name={category.name}
                slug={category.slug}
                imageUrl={category.imageUrl}
                href={category.href}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
