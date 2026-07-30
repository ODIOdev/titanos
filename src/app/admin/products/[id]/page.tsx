import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminProduct,
} from "@/lib/data/admin";

type Params = Promise<{ id: string }>;

export default async function AdminEditProductPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
    getAdminBrands(),
  ]);

  if (!product) notFound();

  return (
    <AdminProductForm
      mode="edit"
      productId={product.id}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      defaultValues={{
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.short_description ?? "",
        description: product.description ?? "",
        categoryId: product.category_id ?? "",
        brandId: product.brand_id ?? "",
        price: product.price,
        compareAtPrice: product.compare_at_price,
        cost: product.cost,
        inventoryQuantity: product.inventory_quantity,
        lowStockThreshold: product.low_stock_threshold,
        weight: product.weight,
        shippingClass: product.shipping_class ?? "",
        active: product.active,
        featured: product.featured,
        bestseller: product.bestseller,
        productType: product.product_type ?? "",
        ansiClass: product.ansi_class ?? "",
        color: product.color ?? "",
        size: product.size ?? "",
      }}
    />
  );
}
