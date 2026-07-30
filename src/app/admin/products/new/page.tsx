import { AdminProductForm } from "@/components/admin/admin-product-form";
import { getAdminBrands, getAdminCategories } from "@/lib/data/admin";

export default async function AdminNewProductPage() {
  const [categories, brands] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
  ]);

  return (
    <AdminProductForm
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
