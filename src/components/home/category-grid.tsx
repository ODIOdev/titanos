import { CategoryCard } from "@/components/home/category-card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  DEPARTMENT_OPTIONS,
  departmentImagePath,
} from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";

export type CategoryGridProps = {
  className?: string;
};

/** Homepage tile wording, where it differs from the admin Department label. */
const TILE_LABELS: Record<string, string> = {
  "safety-equipment": "Construction",
  "traffic-control": "Roadway & Traffic",
  "foot-wear": "Work Boots",
  signage: "Street Signs",
};

/** Homepage browse strip — synced with admin Department options. */
export function CategoryGrid({ className }: CategoryGridProps) {
  const departments = DEPARTMENT_OPTIONS.map((d) => ({
    slug: d.slug,
    name: TILE_LABELS[d.slug] ?? d.label,
    imageUrl: departmentImagePath(d.slug),
    href: `/shop?department=${encodeURIComponent(d.value)}`,
  }));

  return (
    <section
      className={cn("bg-white py-8 sm:py-10", className)}
      aria-labelledby="shop-by-industry-heading"
    >
      <div className="container-titan">
        <SectionHeader
          title="Shop by industry"
          titleId="shop-by-industry-heading"
          href="/shop"
          linkLabel="View all"
          className="mb-5"
        />

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {departments.map((department) => (
            <li key={department.slug}>
              <CategoryCard
                name={department.name}
                slug={department.slug}
                imageUrl={department.imageUrl}
                href={department.href}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
