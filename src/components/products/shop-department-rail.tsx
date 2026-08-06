import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  departmentImagePath,
  toDepartmentOption,
} from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";

export type ShopDepartmentRailItem = {
  label: string;
  value: string;
};

export type ShopDepartmentRailProps = {
  departments: ShopDepartmentRailItem[];
  /** Currently selected department filter value, if any. */
  activeDepartment?: string;
  /** Preserve category path when browsing inside a category page. */
  basePath?: string;
  className?: string;
};

/** Shop-rail-only thumbs (homepage industry tiles keep their own art). */
const SHOP_RAIL_IMAGE_OVERRIDES: Record<string, string> = {
  "traffic-control": "/images/categories/traffic-control-shop.png",
};

function departmentHref(basePath: string, value: string) {
  const params = new URLSearchParams({ department: value });
  return `${basePath}?${params.toString()}`;
}

type TileProps = {
  href: string;
  label: string;
  active: boolean;
  imageUrl?: string;
  variant?: "department" | "all";
};

function AllTileMark({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[1.35rem] grid-cols-2 gap-0.5 @3xl:size-6 @3xl:gap-1",
        active ? "text-dark-charcoal" : "text-white",
      )}
      aria-hidden
    >
      <span className="rounded-[2px] bg-current opacity-95" />
      <span className="rounded-[2px] bg-current opacity-70" />
      <span className="rounded-[2px] bg-current opacity-70" />
      <span className="rounded-[2px] bg-current opacity-45" />
    </span>
  );
}

function DepartmentTile({
  href,
  label,
  active,
  imageUrl,
  variant = "department",
  tabIndex,
}: TileProps & { tabIndex?: number }) {
  const isAll = variant === "all";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={isAll ? "All products" : label}
      tabIndex={tabIndex}
      className="group flex w-16 flex-col items-center gap-1.5 focus-visible:outline-none @3xl:w-[4.5rem]"
    >
      <span
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border transition-[border-color,box-shadow,background-color,transform] @3xl:size-14",
          "group-focus-visible:ring-2 group-focus-visible:ring-titan-yellow",
          isAll
            ? active
              ? "border-titan-yellow bg-titan-yellow shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]"
              : "border-dark-charcoal bg-dark-charcoal group-hover:border-titan-yellow group-hover:bg-[#2a2a2a]"
            : cn(
                "bg-light-gray",
                active
                  ? "border-dark-charcoal ring-1 ring-dark-charcoal"
                  : "border-border-gray group-hover:border-dark-charcoal",
              ),
        )}
      >
        {isAll ? (
          <AllTileMark active={active} />
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-contain"
            unoptimized
          />
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-2 text-center text-[11px] leading-tight @3xl:text-xs",
          active
            ? "font-semibold text-dark-charcoal"
            : isAll
              ? "font-medium text-dark-charcoal group-hover:text-dark-charcoal"
              : "text-medium-gray group-hover:text-dark-charcoal",
        )}
      >
        {isAll ? "All" : label}
      </span>
    </Link>
  );
}

/** Quick department switcher — auto-scrolling single-row carousel. */
export function ShopDepartmentRail({
  departments,
  activeDepartment,
  basePath = "/shop",
  className,
}: ShopDepartmentRailProps) {
  if (departments.length === 0) return null;

  const allActive = !activeDepartment;

  const items: TileProps[] = [
    {
      href: basePath,
      label: "All",
      active: allActive,
      variant: "all",
    },
    ...departments.map((department) => {
      const option = toDepartmentOption(department.value);
      return {
        href: departmentHref(basePath, department.value),
        label: department.label,
        active:
          activeDepartment?.toLowerCase() === department.value.toLowerCase(),
        imageUrl:
          SHOP_RAIL_IMAGE_OVERRIDES[option.slug] ??
          departmentImagePath(option.slug),
        variant: "department" as const,
      };
    }),
  ];

  // Duplicate the lap so translateX(-50%) loops seamlessly.
  const marqueeItems = [...items, ...items];
  const durationSeconds = Math.max(18, items.length * 2.8);

  return (
    <nav
      aria-label="Shop departments"
      className={cn("shop-department-rail", className)}
    >
      <div className="shop-department-rail-carousel marquee-viewport relative -mx-4 overflow-hidden px-4 [mask-image:linear-gradient(to_right,transparent,black_1.25rem,black_calc(100%-1.25rem),transparent)] @3xl:mx-0 @3xl:px-0 @3xl:[mask-image:none] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none] motion-reduce:[scrollbar-width:none] motion-reduce:[&::-webkit-scrollbar]:hidden">
        <ul
          className="animate-marquee flex w-max items-start gap-3 pb-0.5 @3xl:gap-3.5 motion-reduce:animate-none"
          style={
            {
              "--marquee-duration": `${durationSeconds}s`,
            } as CSSProperties
          }
        >
          {marqueeItems.map((item, index) => {
            const isClone = index >= items.length;
            const isAll = item.variant === "all";
            return (
              <li
                key={`${item.href}-${item.label}-${index}`}
                className={cn("shrink-0", isAll && "hidden @5xl:block")}
                aria-hidden={isClone || undefined}
              >
                <DepartmentTile
                  {...item}
                  tabIndex={isClone ? -1 : undefined}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
