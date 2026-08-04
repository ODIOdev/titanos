import Link from "next/link";
import {
  CircleOff,
  FolderKanban,
  FolderOpen,
  Layers,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { AddDepartmentButton } from "@/components/admin/add-department-button";
import { CategoryRowActions } from "@/components/admin/category-row-actions";
import { DataTable } from "@/components/admin/data-table";
import { DepartmentsManagementCard } from "@/components/admin/departments-management-card";
import { TagsManagementCard } from "@/components/admin/tags-management-card";
import { Badge } from "@/components/ui/badge";
import {
  getAdminCategories,
  getAdminCategoryDetail,
  getAdminDepartments,
  getAdminTags,
} from "@/lib/data/admin";
import { matchesQuery } from "@/lib/search";
import { cn, formatCurrency } from "@/lib/utils";

/** Status bars fill completely at this product count. */
const STATUS_BAR_CAP = 100;

type TabId = "all" | "active" | "inactive" | "empty";
type SearchParams = Promise<{ q?: string; tab?: string }>;

type CategoryRow = {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
  };
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

function buildHref(opts: { tab?: TabId; q?: string }) {
  const params = new URLSearchParams();
  if (opts.tab && opts.tab !== "all") params.set("tab", opts.tab);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  const qs = params.toString();
  return qs ? `/admin/categories?${qs}` : "/admin/categories";
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
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

  const query = q.trim().toLowerCase();
  const visible = lists[tab].filter(({ category: c }) => {
    if (!query) return true;
    return (
      matchesQuery(c.name, query) ||
      matchesQuery(c.slug, query) ||
      matchesQuery(c.description, query)
    );
  });

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
    { title: string; description: string; empty: string }
  > = {
    all: {
      title: "All categories",
      description: "Full catalog taxonomy and performance.",
      empty: "No categories found.",
    },
    active: {
      title: "Active categories",
      description: "Visible and available for product assignment.",
      empty: "No active categories.",
    },
    inactive: {
      title: "Inactive categories",
      description: "Hidden from storefront browsing.",
      empty: "No inactive categories.",
    },
    empty: {
      title: "Empty categories",
      description: "Categories with no products assigned yet.",
      empty: "Every category has at least one product.",
    },
  };

  const hasFilters = Boolean(query || tab !== "all");

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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchForm
            placeholder="Search categories…"
            defaultValue={q}
            label="Search categories"
            hiddenFields={tab !== "all" ? { tab } : undefined}
          />
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <AddDepartmentButton />
            <Link
              href="/admin/categories/new"
              className="inline-flex h-10 items-center justify-center rounded-sm bg-titan-yellow px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
            >
              Add new category
            </Link>
          </div>
        </div>

        <nav
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
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
            href={buildHref({ tab: "all", q })}
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
            href={buildHref({ tab: "active", q })}
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
            href={buildHref({ tab: "inactive", q })}
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
            href={buildHref({ tab: "empty", q })}
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

        <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-start">
          <DepartmentsManagementCard departments={departments} />

          <div className="min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white">
            <div className="border-b border-border-gray px-4 py-4 sm:px-5">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
                {tabMeta[tab].title}
              </h2>
              <p className="mt-0.5 text-sm text-medium-gray">
                {tabMeta[tab].description}
                <span className="ml-1.5 tabular-nums text-dark-charcoal">
                  · {visible.length} item{visible.length === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <DataTable
              className="rounded-none border-0"
              compact
              columns={[
                { key: "name", header: "Name", className: "w-[42%]" },
                { key: "products", header: "Products", className: "w-[14%]" },
                { key: "status", header: "Status", className: "w-[20%]" },
                {
                  key: "actions",
                  header: "Actions",
                  className: "w-[24%] text-right",
                },
              ]}
              emptyMessage={
                hasFilters && query
                  ? `No categories match “${q.trim()}”.`
                  : tabMeta[tab].empty
              }
              rows={visible.map(({ category: c, productCount }) => [
                <div key={`${c.id}-name`} className="min-w-0">
                  <Link
                    href={`/admin/categories/${c.id}`}
                    className="block truncate font-medium text-dark-charcoal hover:text-titan-yellow"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-medium-gray">{c.slug}</p>
                </div>,
                <span key={`${c.id}-products`} className="tabular-nums">
                  {productCount}
                </span>,
                <Badge
                  key={`${c.id}-status`}
                  variant={c.active ? "success" : "default"}
                >
                  {c.active ? "Active" : "Inactive"}
                </Badge>,
                <CategoryRowActions
                  key={`${c.id}-actions`}
                  categoryId={c.id}
                  categoryName={c.name}
                />,
              ])}
            />
          </div>
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
        "group relative overflow-hidden rounded-sm border bg-white p-4 transition-colors",
        active
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
      aria-current={active ? "page" : undefined}
    >
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
    </Link>
  );
}
