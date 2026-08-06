import { AdminProductForm } from "@/components/admin/admin-product-form";
import { nextCategorySku } from "@/lib/admin/category-sku";
import {
  ADMIN_RETURN_PARAM,
  adminReturnTarget,
  categoryIdFromReturn,
} from "@/lib/admin/return-to";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminProducts,
  getCatalogDepartmentOptions,
  getCatalogSizeOptions,
  getCatalogTagOptions,
} from "@/lib/data/admin";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminNewProductPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const fromRaw = query[ADMIN_RETURN_PARAM];
  const from = typeof fromRaw === "string" ? fromRaw : undefined;
  const returnTarget = adminReturnTarget(from);
  const returnHref = returnTarget?.href ?? "/admin/products";
  const categoryFromReturn = categoryIdFromReturn(from);

  const [
    categories,
    brands,
    tagOptions,
    sizeOptions,
    departmentOptions,
    allProducts,
  ] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
    getCatalogTagOptions(),
    getCatalogSizeOptions(),
    getCatalogDepartmentOptions(),
    getAdminProducts({ active: "all" }),
  ]);

  const category =
    categoryFromReturn != null
      ? (categories.find((c) => c.id === categoryFromReturn) ?? null)
      : null;

  const nextSku = category
    ? nextCategorySku(
        allProducts.map((p) => p.sku),
        category,
      )
    : null;

  return (
    <AdminProductForm
      mode="create"
      returnHref={returnHref}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      tagOptions={tagOptions}
      sizeOptions={sizeOptions}
      departmentOptions={departmentOptions}
      defaultValues={
        category
          ? {
              categoryId: category.id,
              sku: nextSku?.sku ?? "",
              department: category.department?.trim() || "",
            }
          : undefined
      }
    />
  );
}
