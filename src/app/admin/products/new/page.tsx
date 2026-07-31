import { AdminProductForm } from "@/components/admin/admin-product-form";
import {
  getAdminBrands,
  getAdminCategories,
  getCatalogSizeOptions,
  getCatalogTagOptions,
} from "@/lib/data/admin";

export default async function AdminNewProductPage() {
  const [categories, brands, tagOptions, sizeOptions] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
    getCatalogTagOptions(),
    getCatalogSizeOptions(),
  ]);

  return (
    <AdminProductForm
      mode="create"
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      tagOptions={tagOptions}
      sizeOptions={sizeOptions}
    />
  );
}
