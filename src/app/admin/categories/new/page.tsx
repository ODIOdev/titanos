import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { getAdminDepartments } from "@/lib/data/admin";

export default async function AdminNewCategoryPage() {
  const departments = await getAdminDepartments();

  return (
    <AdminCategoryForm
      departmentOptions={departments.map((d) => ({
        label: d.name,
        value: d.name,
      }))}
    />
  );
}
