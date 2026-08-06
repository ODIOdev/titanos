import { CategoryCard } from "@/components/home/category-card";
import { SectionHeader } from "@/components/shared/section-header";
import { departmentImagePath } from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";

export type CategoryGridProps = {
  className?: string;
};

/** Homepage industry tiles — includes Foot Wear even when it’s hidden from the shop rail. */
const HOME_INDUSTRY_TILES = [
  {
    slug: "safety-equipment",
    name: "Construction",
    href: `/shop?department=${encodeURIComponent("Safety Equipment")}`,
    imageUrl: departmentImagePath("safety-equipment"),
  },
  {
    slug: "traffic-control",
    name: "Roadway & Traffic",
    href: `/shop?department=${encodeURIComponent("Traffic Control")}`,
    imageUrl: departmentImagePath("traffic-control"),
  },
  {
    slug: "foot-wear",
    name: "Work Boots",
    href: `/shop?department=${encodeURIComponent("Safety Shoes & Boots")}`,
    imageUrl: departmentImagePath("foot-wear"),
  },
  {
    slug: "signage",
    name: "Street Signs",
    href: `/shop?department=${encodeURIComponent("Signage")}`,
    imageUrl: "/images/categories/signage-industry-v4.jpg",
  },
] as const;

/** Homepage browse strip — industry entry points into the shop. */
export function CategoryGrid({ className }: CategoryGridProps) {
  return (
    <section
      className={cn("bg-white py-0 @3xl:py-8 @5xl:py-10", className)}
      aria-label="Shop by industry"
    >
      {/* Mobile / phone-preview: tight static grid */}
      <ul className="grid grid-cols-2 @3xl:hidden">
        {HOME_INDUSTRY_TILES.map((department) => (
          <li key={department.slug}>
            <CategoryCard
              name={department.name}
              slug={department.slug}
              imageUrl={department.imageUrl}
              href={department.href}
              className="rounded-none border-0 shadow-none hover:border-0 hover:shadow-none focus-visible:ring-inset focus-visible:ring-offset-0"
            />
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: headed grid */}
      <div className="container-titan hidden @3xl:block">
        <SectionHeader
          title="Shop by industry"
          titleId="shop-by-industry-heading"
          href="/shop"
          linkLabel="View all"
          className="mb-5"
        />

        <ul className="grid grid-cols-4 gap-4">
          {HOME_INDUSTRY_TILES.map((department) => (
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
