import { notFound } from "next/navigation";
import { parseCertificationAnswers } from "@/lib/catalog/certifications";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { ADMIN_RETURN_PARAM, adminReturnTarget } from "@/lib/admin/return-to";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminProduct,
  getCatalogDepartmentOptions,
  getCatalogSizeOptions,
  getCatalogTagOptions,
} from "@/lib/data/admin";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const from = query[ADMIN_RETURN_PARAM];
  const returnHref = adminReturnTarget(
    typeof from === "string" ? from : undefined,
  )?.href;
  const [product, categories, brands, tagOptions, sizeOptions, departmentOptions] =
    await Promise.all([
      getAdminProduct(id),
      getAdminCategories(),
      getAdminBrands(),
      getCatalogTagOptions(),
      getCatalogSizeOptions(),
      getCatalogDepartmentOptions(),
    ]);

  if (!product) notFound();

  return (
    <AdminProductForm
      mode="edit"
      productId={product.id}
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
      initialImages={(product.images ?? []).map((img, index) => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text ?? product.name,
        isPrimary: img.is_primary || index === 0,
      })).concat(
        !product.images?.length && product.image_url
          ? [
              {
                id: "primary-fallback",
                url: product.image_url,
                altText: product.name,
                isPrimary: true,
              },
            ]
          : [],
      )}
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
        catalogStatus:
          product.metadata?.status === "draft"
            ? "draft"
            : product.metadata?.status === "archived"
              ? "archived"
              : product.active
                ? "active"
                : "archived",
        active: product.active,
        featured: product.featured,
        bestseller: product.bestseller,
        productType: product.product_type ?? "",
        department: product.department ?? "",
        gender:
          typeof product.metadata?.gender === "string"
            ? product.metadata.gender
            : "",
        tag:
          typeof product.metadata?.tag === "string" ? product.metadata.tag : "",
        ansiClass: product.ansi_class ?? "",
        color: product.color ?? "",
        size: product.size ?? "",
        hasMultipleSizes: product.metadata?.hasMultipleSizes === true,
        variants: Array.isArray(product.metadata?.variants)
          ? product.metadata.variants
              .map((row) => {
                if (!row || typeof row !== "object") return null;
                const r = row as Record<string, unknown>;
                return {
                  color: typeof r.color === "string" ? r.color : "",
                  size: typeof r.size === "string" ? r.size : "",
                  qty:
                    typeof r.qty === "number"
                      ? r.qty
                      : Number(r.qty) || 0,
                };
              })
              .filter(
                (row): row is { color: string; size: string; qty: number } =>
                  row != null,
              )
          : [],
        specifications: (product.specifications ?? []).map((spec) => ({
          name: spec.name,
          value: spec.value,
        })),
        certifications: parseCertificationAnswers(
          product.metadata?.certifications,
        ),
      }}
    />
  );
}
