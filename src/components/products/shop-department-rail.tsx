import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
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

const thumbFrameClass =
  "relative flex size-12 items-center justify-center overflow-hidden rounded-sm border bg-light-gray transition-[border-color,box-shadow] sm:size-14";

function departmentHref(basePath: string, value: string) {
  const params = new URLSearchParams({ department: value });
  return `${basePath}?${params.toString()}`;
}

/** Quick department switcher with compact thumbnail tiles. */
export function ShopDepartmentRail({
  departments,
  activeDepartment,
  basePath = "/shop",
  className,
}: ShopDepartmentRailProps) {
  if (departments.length === 0) return null;

  const allActive = !activeDepartment;

  return (
    <nav
      aria-label="Shop departments"
      className={cn(
        "-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0",
        className,
      )}
    >
      <ul className="flex w-max items-start gap-3 pb-0.5 sm:gap-3.5">
        <li className="w-14 sm:w-16">
          <Link
            href={basePath}
            aria-current={allActive ? "page" : undefined}
            className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
          >
            <span
              className={cn(
                thumbFrameClass,
                allActive
                  ? "border-dark-charcoal ring-1 ring-dark-charcoal"
                  : "border-border-gray group-hover:border-dark-charcoal",
                "group-focus-visible:ring-2 group-focus-visible:ring-titan-yellow",
              )}
            >
              <LayoutGrid
                className={cn(
                  "size-5 sm:size-6",
                  allActive ? "text-dark-charcoal" : "text-medium-gray",
                )}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "line-clamp-2 text-center text-[11px] leading-tight sm:text-xs",
                allActive
                  ? "font-medium text-dark-charcoal"
                  : "text-medium-gray group-hover:text-dark-charcoal",
              )}
            >
              All
            </span>
          </Link>
        </li>

        {departments.map((department) => {
          const option = toDepartmentOption(department.value);
          const active =
            activeDepartment?.toLowerCase() === department.value.toLowerCase();
          const imageUrl = departmentImagePath(option.slug);

          return (
            <li key={department.value} className="w-14 sm:w-16">
              <Link
                href={departmentHref(basePath, department.value)}
                aria-current={active ? "page" : undefined}
                aria-label={department.label}
                className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    thumbFrameClass,
                    active
                      ? "border-dark-charcoal ring-1 ring-dark-charcoal"
                      : "border-border-gray group-hover:border-dark-charcoal",
                    "group-focus-visible:ring-2 group-focus-visible:ring-titan-yellow",
                  )}
                >
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain"
                    unoptimized
                  />
                </span>
                <span
                  className={cn(
                    "line-clamp-2 text-center text-[11px] leading-tight sm:text-xs",
                    active
                      ? "font-medium text-dark-charcoal"
                      : "text-medium-gray group-hover:text-dark-charcoal",
                  )}
                >
                  {department.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
