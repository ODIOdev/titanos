import { notFound } from "next/navigation";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { getAdminCategoryDetail, getAdminDepartments } from "@/lib/data/admin";

type Params = Promise<{ id: string }>;

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [detail, departments] = await Promise.all([
    getAdminCategoryDetail(id),
    getAdminDepartments(),
  ]);
  if (!detail) notFound();

  const { category } = detail;

  return (
    <AdminCategoryForm
      mode="edit"
      categoryId={category.id}
      departmentOptions={departments.map((d) => ({
        label: d.name,
        value: d.name,
      }))}
      defaultValues={{
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        imageUrl: category.image_url ?? "",
        sortOrder: category.sort_order ?? 0,
        active: category.active,
        skuPrefix: category.sku_prefix ?? "",
        department: category.department ?? "",
      }}
    />
  );
}
