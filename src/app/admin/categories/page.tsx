import Link from "next/link";
import {
  CircleOff,
  FolderKanban,
  FolderOpen,
  Layers,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";
import { CategoriesManagementCard } from "@/components/admin/categories-management-card";
import { DepartmentsManagementCard } from "@/components/admin/departments-management-card";
import { TagsManagementCard } from "@/components/admin/tags-management-card";
import {
  getAdminCategories,
  getAdminCategoryDetail,
  getAdminDepartments,
  getAdminTags,
} from "@/lib/data/admin";
import { cn, formatCurrency } from "@/lib/utils";
import type { Category } from "@/types";

/** Status bars fill completely at this product count. */
const STATUS_BAR_CAP = 100;

type TabId = "all" | "active" | "inactive" | "empty";
type SearchParams = Promise<{ tab?: string }>;

type CategoryRow = {
  category: Category;
  productCount: number;
  brandCount: number;
  inventory: number;
  sales: number;
};

function statusBarShare(productCount: number) {
  return Math.min(100, (productCount / STATUS_BAR_CAP) * 100);
}

function parseTab(value: string | undefined): TabId {
  if (value === "active" || value === "inactive" || value === "empty") {
    return value;
  }
  return "all";
}

function buildHref(opts: { tab?: TabId }) {
  const params = new URLSearchParams();
  if (opts.tab && opts.tab !== "all") params.set("tab", opts.tab);
  const qs = params.toString();
  const path = qs ? `/admin/categories?${qs}` : "/admin/categories";
  return `${path}#categories`;
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);

  const [categories, tags, departments] = await Promise.all([
    getAdminCategories(),
    getAdminTags(),
    getAdminDepartments(),
  ]);

  const details: CategoryRow[] = await Promise.all(
    categories.map(async (c) => {
      const detail = await getAdminCategoryDetail(c.id);
      return {
        category: c,
        productCount: detail?.productCount ?? 0,
        brandCount: detail?.brandCount ?? 0,
        inventory: detail?.totalInventory ?? 0,
        sales: detail?.totalSales ?? 0,
      };
    }),
  );

  const active = details.filter((d) => d.category.active);
  const inactive = details.filter((d) => !d.category.active);
  const empty = details.filter((d) => d.productCount === 0);

  const lists: Record<TabId, CategoryRow[]> = {
    all: details,
    active,
    inactive,
    empty,
  };

  const visible = lists[tab];

  const total = Math.max(details.length, 1);
  const totalProducts = details.reduce((sum, d) => sum + d.productCount, 0);
  const totalInventory = details.reduce((sum, d) => sum + d.inventory, 0);
  const totalSales = details.reduce((sum, d) => sum + d.sales, 0);
  const activeProducts = active.reduce((sum, d) => sum + d.productCount, 0);
  const activeInventory = active.reduce((sum, d) => sum + d.inventory, 0);
  const activeSales = active.reduce((sum, d) => sum + d.sales, 0);
  const inactiveProducts = inactive.reduce((sum, d) => sum + d.productCount, 0);

  const tabMeta: Record<
    TabId,
    { title: string; empty: string }
  > = {
    all: {
      title: "All categories",
      empty: "No categories found.",
    },
    active: {
      title: "Active categories",
      empty: "No active categories.",
    },
    inactive: {
      title: "Inactive categories",
      empty: "No inactive categories.",
    },
    empty: {
      title: "Empty categories",
      empty: "Every category has at least one product.",
    },
  };

  const departmentProductCount = departments.reduce(
    (sum, d) => sum + d.productCount,
    0,
  );
  const catalogDepartmentCount = departments.filter(
    (d) => d.source === "catalog",
  ).length;
  const customDepartmentCount = departments.filter(
    (d) => d.source === "custom" || d.source === "product",
  ).length;

  return (
    <div className="space-y-5 @5xl:space-y-8">
      <div className="space-y-3 @5xl:space-y-4">
        <nav
          className="grid grid-cols-1 gap-1.5 @5xl:grid-cols-5 @5xl:gap-3"
          aria-label="Category filters"
        >
          <CategoryMetricCard
            href="#departments"
            label="Departments"
            value={String(departments.length)}
            hint={`${departmentProductCount} products assigned`}
            icon={Layers}
            active={false}
            accent="bg-sky-100 text-sky-800"
            barClass="bg-sky-400"
            share={statusBarShare(departmentProductCount)}
            spark={[
              { label: "Catalog", value: String(catalogDepartmentCount) },
              { label: "Custom", value: String(customDepartmentCount) },
            ]}
          />
          <CategoryMetricCard
            href={buildHref({ tab: "all" })}
            label="Categories"
            value={String(details.length)}
            hint={`${totalProducts} products across catalog`}
            icon={FolderKanban}
            active={tab === "all"}
            accent="bg-titan-yellow/25 text-dark-charcoal"
            barClass="bg-titan-yellow"
            share={statusBarShare(totalProducts)}
            spark={[
              { label: "Stock", value: totalInventory.toLocaleString() },
              { label: "Sales", value: formatCurrency(totalSales) },
            ]}
          />
          <CategoryMetricCard
            href={buildHref({ tab: "active" })}
            label="Active"
            value={String(active.length)}
            hint={`${activeProducts} products live`}
            icon={FolderOpen}
            active={tab === "active"}
            accent="bg-emerald-100 text-emerald-800"
            barClass="bg-emerald-400"
            share={statusBarShare(activeProducts)}
            spark={[
              { label: "Stock", value: activeInventory.toLocaleString() },
              { label: "Sales", value: formatCurrency(activeSales) },
            ]}
          />
          <CategoryMetricCard
            href={buildHref({ tab: "inactive" })}
            label="Inactive"
            value={String(inactive.length)}
            hint="Hidden from shop"
            icon={CircleOff}
            active={tab === "inactive"}
            accent="bg-slate-100 text-slate-700"
            barClass="bg-slate-400"
            share={statusBarShare(inactiveProducts)}
            spark={[
              {
                label: "Products",
                value: String(inactiveProducts),
              },
              {
                label: "Share",
                value: `${Math.round((inactive.length / total) * 100)}%`,
              },
            ]}
          />
          <CategoryMetricCard
            href={buildHref({ tab: "empty" })}
            label="Empty"
            value={String(empty.length)}
            hint="No products assigned"
            icon={PackageOpen}
            active={tab === "empty"}
            accent={
              empty.length > 0
                ? "bg-orange-100 text-orange-800"
                : "bg-emerald-100 text-emerald-800"
            }
            barClass={empty.length > 0 ? "bg-orange-400" : "bg-emerald-400"}
            share={statusBarShare(0)}
            spark={[
              {
                label: "Active",
                value: String(empty.filter((d) => d.category.active).length),
              },
              {
                label: "Share",
                value: `${Math.round((empty.length / total) * 100)}%`,
              },
            ]}
          />
        </nav>

        <div className="grid min-w-0 gap-3 @5xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @5xl:items-start @5xl:gap-4">
          <DepartmentsManagementCard departments={departments} />

          <CategoriesManagementCard
            listKey={tab}
            title={tabMeta[tab].title}
            emptyMessage={tabMeta[tab].empty}
            departmentOptions={departments.map((d) => ({
              label: d.name,
              value: d.name,
            }))}
            categories={[...visible]
              .sort((a, b) => {
                if (a.category.active !== b.category.active) {
                  return a.category.active ? -1 : 1;
                }
                return a.category.name.localeCompare(b.category.name, undefined, {
                  sensitivity: "base",
                });
              })
              .map(({ category: c, productCount }) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                description: c.description,
                imageUrl: c.image_url,
                sortOrder: c.sort_order,
                active: c.active,
                productCount,
                department: c.department ?? null,
              }))}
          />
        </div>
      </div>

      <TagsManagementCard tags={tags} />
    </div>
  );
}

function CategoryMetricCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  active,
  accent,
  barClass,
  share,
  spark,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  active: boolean;
  accent: string;
  barClass: string;
  share: number;
  spark: { label: string; value: string }[];
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-sm border bg-white px-3 py-2 transition-colors @5xl:p-4",
        active
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
      aria-current={active ? "page" : undefined}
    >
      {/* Mobile: compact single-row strip + status bar */}
      <div className="@5xl:hidden">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-sm",
              accent,
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              {label}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[0.65rem] text-medium-gray">
              {hint}
            </p>
          </div>
          <p className="shrink-0 font-heading text-xl font-semibold tabular-nums leading-none text-dark-charcoal">
            {value}
          </p>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-light-gray">
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Desktop: original card layout */}
      <div className="hidden @5xl:block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-medium-gray">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-semibold tabular-nums text-dark-charcoal">
              {value}
            </p>
            <p className="mt-1 text-xs text-medium-gray">{hint}</p>
          </div>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-sm",
              accent,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {spark.map((item) => (
            <div
              key={item.label}
              className="rounded-sm bg-light-gray/70 px-2 py-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-dark-charcoal">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-light-gray">
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
