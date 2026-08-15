"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  CategoryFormInput,
  ProductFormInput,
  BrandFormInput,
  MemberFormInput,
} from "@/lib/validations";
import {
  categoryFormSchema,
  productFormSchema,
  brandFormSchema,
  memberFormSchema,
} from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEFAULT_MAINTENANCE_HEADLINE,
  DEFAULT_MAINTENANCE_MESSAGE,
  MAINTENANCE_SETTINGS_KEY,
} from "@/lib/data/maintenance";
import {
  serializeAnsiClasses,
  serializeProductTags,
  sortDepartmentNames,
} from "@/lib/data/catalog-options";
import { serializeCertificationAnswers } from "@/lib/catalog/certifications";
import {
  normalizeStockVariants,
  sumVariantQuantities,
} from "@/lib/catalog/product-stock";
import {
  absoluteUrl,
  generateOrderNumber,
  isMasterAdmin,
  isMasterAdminEmail,
  slugify,
} from "@/lib/utils";
import type { CatalogStatus } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { OrderStatus, QuoteStatus } from "@/types";

export type ActionResult = {
  success: boolean;
  message: string;
  id?: string;
};

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; result: ActionResult }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      result: {
        success: false,
        message: "Supabase is not configured. Demo mode cannot persist changes.",
      },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        result: { success: false, message: "You must be signed in." },
      };
    }

    if (isMasterAdminEmail(user.email)) {
      return { ok: true, userId: user.id };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();

    if (!isMasterAdmin(profile)) {
      return {
        ok: false,
        result: { success: false, message: "Master admin access required." },
      };
    }

    return { ok: true, userId: user.id };
  } catch {
    return {
      ok: false,
      result: { success: false, message: "Unable to verify admin access." },
    };
  }
}

function mapProductPayload(
  input: ProductFormInput,
  existingMetadata?: Record<string, unknown> | null,
) {
  const status = (input.catalogStatus ??
    (input.active ? "active" : "archived")) as CatalogStatus;
  const active = status === "active";
  const touchScreen = Boolean(input.touchScreen);
  let tagList = [...(input.tags ?? [])];
  if (touchScreen) {
    if (!tagList.some((t) => t.trim().toLowerCase() === "touch screen")) {
      tagList = [...tagList, "Touch Screen"];
    }
  } else {
    tagList = tagList.filter(
      (t) => t.trim().toLowerCase() !== "touch screen",
    );
  }
  const { tags: resolvedTags, tag: resolvedTag } =
    serializeProductTags(tagList);

  return {
    name: input.name,
    slug: input.slug || slugify(input.name),
    sku: input.sku,
    short_description: input.shortDescription || null,
    description: input.description || null,
    category_id: input.categoryId || null,
    brand_id: input.brandId || null,
    price: input.price,
    compare_at_price: input.compareAtPrice ?? null,
    cost: input.cost ?? null,
    inventory_quantity: input.hasMultipleSizes
      ? sumVariantQuantities(input.variants) ||
        Math.max(0, Number(input.inventoryQuantity) || 0)
      : input.inventoryQuantity,
    low_stock_threshold: input.lowStockThreshold ?? 10,
    weight: input.weight ?? null,
    shipping_class: input.shippingClass || null,
    active,
    featured: input.featured ?? false,
    bestseller: input.bestseller ?? false,
    product_type: input.productType || null,
    department: input.department || null,
    ansi_class: serializeAnsiClasses(
      (input.primaryCertifications ?? []).map((row) => row.name),
    ),
    color: input.hasMultipleSizes
      ? (input.variants ?? []).find((row) => row.color.trim())?.color ||
        input.color ||
        null
      : input.color || null,
    size: input.size || null,
    metadata: {
      ...(existingMetadata ?? {}),
      status,
      tag: resolvedTag,
      tags: resolvedTags,
      ...(input.gender?.trim()
        ? { gender: input.gender.trim() }
        : { gender: null }),
      touchScreen,
      hasMultipleSizes: Boolean(input.hasMultipleSizes),
      variants: input.hasMultipleSizes
        ? normalizeStockVariants(input.variants)
        : [],
      primaryCertifications: serializeCertificationAnswers(
        input.primaryCertifications ?? [],
      ),
      certifications: serializeCertificationAnswers(input.certifications ?? []),
      materials: [
        ...new Set(
          (input.materials ?? [])
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ],
    },
  };
}

export async function createCategory(raw: CategoryFormInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = categoryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid category data.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug || slugify(parsed.data.name),
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      sort_order: parsed.data.sortOrder ?? 0,
      // Empty categories stay inactive until a product is assigned.
      active: false,
      department: parsed.data.department?.trim() || null,
      ...(parsed.data.skuPrefix !== undefined
        ? {
            sku_prefix: parsed.data.skuPrefix.trim()
              ? parsed.data.skuPrefix.trim().toUpperCase()
              : null,
          }
        : {}),
    };

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return { success: true, message: "Category created.", id: data.id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create category.",
    };
  }
}

export async function updateCategory(
  id: string,
  raw: CategoryFormInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = categoryFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid category data.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug || slugify(parsed.data.name),
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      sort_order: parsed.data.sortOrder ?? 0,
      department: parsed.data.department?.trim() || null,
      ...(parsed.data.skuPrefix !== undefined
        ? {
            sku_prefix: parsed.data.skuPrefix.trim()
              ? parsed.data.skuPrefix.trim().toUpperCase()
              : null,
          }
        : {}),
    };

    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    // Active flag follows product assignment (empty → inactive).
    await syncCategoryActiveFromProducts(supabase, [id]);

    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath(`/admin/categories/${id}/edit`);
    revalidatePath("/shop");
    return { success: true, message: "Category updated.", id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update category.",
    };
  }
}

export async function updateCategorySkuPrefix(
  id: string,
  rawPrefix: string,
): Promise<ActionResult> {
  const { normalizeCategorySkuPrefix } = await import(
    "@/lib/admin/category-sku"
  );
  const skuPrefix = normalizeCategorySkuPrefix(rawPrefix);
  if (!skuPrefix) {
    return {
      success: false,
      message: "Enter a SKU prefix using letters and numbers.",
    };
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const { setDemoCategorySkuPrefix } = await import("@/lib/data/admin");
      setDemoCategorySkuPrefix(id, skuPrefix);
      revalidatePath("/admin/categories");
      revalidatePath(`/admin/categories/${id}`);
      revalidatePath(`/admin/categories/${id}/edit`);
      revalidatePath("/admin/products/new");
      return {
        success: true,
        message: "SKU prefix updated (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("categories")
      .update({ sku_prefix: skuPrefix })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath(`/admin/categories/${id}/edit`);
    revalidatePath("/admin/products/new");
    revalidatePath("/shop");
    return { success: true, message: "SKU prefix updated." };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to update SKU prefix.",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/categories");
      return {
        success: true,
        message: "Category deleted (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { error: productError } = await supabase
      .from("products")
      .update({ category_id: null })
      .eq("category_id", id);
    if (productError) throw productError;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true, message: "Category deleted." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete category.",
    };
  }
}

async function syncCategoryActiveFromProducts(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  categoryIds: Array<string | null | undefined>,
) {
  const ids = [
    ...new Set(
      categoryIds.filter((id): id is string => Boolean(id?.trim())),
    ),
  ];
  if (ids.length === 0) return;

  for (const categoryId of ids) {
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);
    if (countError) throw countError;

    const active = (count ?? 0) > 0;
    const { error } = await supabase
      .from("categories")
      .update({ active })
      .eq("id", categoryId);
    if (error) throw error;
  }
}

/** Brands with products stay active (homepage); brands with none stay archived. */
async function syncBrandActiveFromProducts(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  brandIds: Array<string | null | undefined>,
) {
  const ids = [
    ...new Set(brandIds.filter((id): id is string => Boolean(id?.trim()))),
  ];
  if (ids.length === 0) return;

  for (const brandId of ids) {
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId);
    if (countError) throw countError;

    const active = (count ?? 0) > 0;
    const { error } = await supabase
      .from("brands")
      .update({ active })
      .eq("id", brandId);
    if (error) throw error;
  }
}

export async function createProduct(
  raw: ProductFormInput,
  images: { url: string; altText?: string; isPrimary?: boolean }[] = [],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const payload = mapProductPayload(parsed.data);
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    if (images.length > 0) {
      await syncProductImages(data.id, images);
    }
    await syncProductSpecifications(
      data.id,
      parsed.data.specifications ?? [],
    );
    await syncCategoryActiveFromProducts(supabase, [payload.category_id]);
    await syncBrandActiveFromProducts(supabase, [payload.brand_id]);

    revalidatePath("/admin/products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Product created.", id: data.id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create product.",
    };
  }
}

export async function updateProduct(
  id: string,
  raw: ProductFormInput,
  images?: { url: string; altText?: string; isPrimary?: boolean }[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("products")
      .select("metadata, category_id, brand_id")
      .eq("id", id)
      .maybeSingle();
    const existingMetadata =
      existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const payload = mapProductPayload(parsed.data, existingMetadata);
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    if (images) {
      await syncProductImages(id, images);
    }
    await syncProductSpecifications(id, parsed.data.specifications ?? []);
    await syncCategoryActiveFromProducts(supabase, [
      existing?.category_id,
      payload.category_id,
    ]);
    await syncBrandActiveFromProducts(supabase, [
      existing?.brand_id,
      payload.brand_id,
    ]);

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Product updated.", id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update product.",
    };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/products");
      revalidatePath("/admin/categories");
      return {
        success: true,
        message: "Product deleted (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("products")
      .select("category_id, brand_id")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    await syncCategoryActiveFromProducts(supabase, [existing?.category_id]);
    await syncBrandActiveFromProducts(supabase, [existing?.brand_id]);

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Product deleted." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete product.",
    };
  }
}

async function syncProductSpecifications(
  productId: string,
  specifications: { name: string; value: string }[],
) {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  await supabase
    .from("product_specifications")
    .delete()
    .eq("product_id", productId);

  const rows = specifications
    .map((spec) => ({
      name: spec.name.trim(),
      value: spec.value.trim(),
    }))
    .filter((spec) => spec.name.length > 0);

  if (rows.length === 0) return;

  const { error } = await supabase.from("product_specifications").insert(
    rows.map((spec, index) => ({
      product_id: productId,
      name: spec.name,
      value: spec.value,
      sort_order: index,
    })),
  );
  if (error) throw error;
}

async function syncProductImages(
  productId: string,
  images: { url: string; altText?: string; isPrimary?: boolean }[],
) {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();

  await supabase.from("product_images").delete().eq("product_id", productId);

  const persistable = images.filter(
    (img) =>
      img.url &&
      !img.url.startsWith("data:") &&
      !img.url.startsWith("blob:"),
  );

  if (persistable.length === 0) return;

  const rows = persistable.map((img, index) => ({
    product_id: productId,
    url: img.url,
    alt_text: img.altText || null,
    sort_order: index,
    is_primary: img.isPrimary ?? index === 0,
  }));

  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw error;
}

export async function uploadProductImage(formData: FormData): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  return uploadCatalogImage(formData, "products");
}

export async function uploadCategoryImage(formData: FormData): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  return uploadCatalogImage(formData, "categories");
}

export async function uploadBrandLogo(formData: FormData): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  return uploadCatalogImage(formData, "brands");
}

export async function uploadMemberAvatar(formData: FormData): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  return uploadCatalogImage(formData, "members");
}

export async function createBrand(raw: BrandFormInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = brandFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid brand data.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug || slugify(parsed.data.name),
      description: parsed.data.description || null,
      logo_url: parsed.data.logoUrl || null,
      website: parsed.data.website || null,
      // New brands stay archived until a product is assigned.
      active: false,
    };

    const { data, error } = await supabase
      .from("brands")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return {
      success: true,
      message: "Brand created. It stays in Archives until a product uses it.",
      id: data.id,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create brand.",
    };
  }
}

export async function updateBrand(
  id: string,
  raw: BrandFormInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = brandFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid brand data.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug || slugify(parsed.data.name),
      description: parsed.data.description || null,
      logo_url: parsed.data.logoUrl || null,
      website: parsed.data.website || null,
    };

    const { error } = await supabase.from("brands").update(payload).eq("id", id);

    if (error) throw error;

    // Active/archived follows whether any product uses this brand.
    await syncBrandActiveFromProducts(supabase, [id]);

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath(`/admin/brands/${id}/edit`);
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Brand updated.", id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update brand.",
    };
  }
}

export async function archiveBrand(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/brands");
      return {
        success: true,
        message: "Brand archived (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", id);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      return {
        success: false,
        message:
          "This brand still has products. Remove the brand from those products to archive it.",
      };
    }

    const { error } = await supabase
      .from("brands")
      .update({ active: false })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Brand archived." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to archive brand.",
    };
  }
}

export async function restoreBrand(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/brands");
      return {
        success: true,
        message: "Brand restored (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", id);
    if (countError) throw countError;

    if ((count ?? 0) === 0) {
      return {
        success: false,
        message:
          "Assign this brand to a product first — brands with no products stay in Archives.",
      };
    }

    const { error } = await supabase
      .from("brands")
      .update({ active: true })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath("/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Brand restored." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to restore brand.",
    };
  }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/brands");
      return {
        success: true,
        message: "Brand deleted (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { error: productError } = await supabase
      .from("products")
      .update({ brand_id: null })
      .eq("brand_id", id);
    if (productError) throw productError;

    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    revalidatePath("/brands");
    revalidatePath("/shop");
    return { success: true, message: "Brand deleted." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete brand.",
    };
  }
}

async function uploadCatalogImage(
  formData: FormData,
  folder: "products" | "categories" | "brands" | "members",
): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "No file provided." };
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (!allowed.includes(file.type)) {
    return { success: false, message: "Use JPG, PNG, WEBP, GIF, or SVG." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { success: false, message: "Image must be 8 MB or smaller." };
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let contentType = file.type;
  let ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  // Brand logos are stored with a transparent backdrop (PNG), except SVG.
  if (folder === "brands") {
    try {
      const { prepareBrandLogo } = await import("@/lib/images/brand-logo");
      const prepared = await prepareBrandLogo(buffer, contentType);
      buffer = Buffer.from(prepared.buffer);
      contentType = prepared.contentType;
      ext = prepared.extension;
    } catch {
      return {
        success: false,
        message: "Could not process brand logo. Try a PNG or SVG.",
      };
    }
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const auth = await requireAdmin();

  if (auth.ok) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const path = `${folder}/${filename}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return { success: true, message: "Image uploaded.", url: data.publicUrl };
    } catch {
      // Fall through to local public/uploads for local/dev without storage.
    }
  }

  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return {
      success: true,
      message: auth.ok
        ? "Image saved locally (storage unavailable)."
        : "Image saved locally (Supabase not configured).",
      url: `/uploads/${folder}/${filename}`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Upload failed. Configure Supabase Storage or enable local uploads.",
    };
  }
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("products")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();
    const metadata = {
      ...(existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {}),
      status: "archived",
    };
    const { error } = await supabase
      .from("products")
      .update({ active: false, metadata })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    return { success: true, message: "Product archived." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to archive product.",
    };
  }
}

export async function replenishProduct(
  id: string,
  amount: number,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const qty = Math.floor(Number(amount));
  if (!Number.isFinite(qty) || qty < 1) {
    return { success: false, message: "Enter a quantity of at least 1." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("inventory_quantity, name, metadata")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return { success: false, message: "Product not found." };
    }

    const metadata: Record<string, unknown> =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};

    let nextQty = Math.max(0, Number(existing.inventory_quantity) || 0) + qty;

    if (metadata.hasMultipleSizes === true && Array.isArray(metadata.variants)) {
      const variants = metadata.variants.map((item) => {
        if (!item || typeof item !== "object") return item;
        return { ...(item as Record<string, unknown>) };
      });
      const target = variants.find((item) => {
        if (!item || typeof item !== "object") return false;
        const row = item as Record<string, unknown>;
        return (
          typeof row.color === "string" &&
          row.color.trim() &&
          typeof row.size === "string" &&
          row.size.trim()
        );
      }) as Record<string, unknown> | undefined;
      if (target) {
        target.qty = Math.max(0, Number(target.qty) || 0) + qty;
        metadata.variants = variants;
        nextQty = sumVariantQuantities(
          variants as { color?: string; size?: string; qty?: number }[],
        );
      }
    }

    const { error } = await supabase
      .from("products")
      .update({
        inventory_quantity: nextQty,
        metadata: metadata as import("@/types/database").Json,
      })
      .eq("id", id);

    if (error) throw error;

    await supabase.from("inventory_movements").insert({
      product_id: id,
      quantity_change: qty,
      reason: "adjustment",
      reference_type: "admin",
      notes: "Admin replenish",
      created_by: auth.userId,
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return {
      success: true,
      message: `Added ${qty} unit${qty === 1 ? "" : "s"} — now ${nextQty} on hand.`,
      id,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to replenish inventory.",
    };
  }
}

export async function restoreProduct(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("products")
      .select("metadata")
      .eq("id", id)
      .maybeSingle();
    const metadata = {
      ...(existing?.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {}),
      status: "active",
    };
    const { error } = await supabase
      .from("products")
      .update({ active: true, metadata })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, message: "Product restored." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to restore product.",
    };
  }
}

export async function bulkArchiveProducts(
  ids: string[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, message: "Select at least one product." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id, metadata")
      .in("id", uniqueIds);

    if (fetchError) throw fetchError;

    for (const row of existing ?? []) {
      const metadata = {
        ...(row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {}),
        status: "archived",
      };
      const { error } = await supabase
        .from("products")
        .update({ active: false, metadata })
        .eq("id", row.id);
      if (error) throw error;
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    const count = existing?.length ?? 0;
    return {
      success: true,
      message:
        count === 1
          ? "1 product archived."
          : `${count} products archived.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to archive products.",
    };
  }
}

export async function bulkRestoreProducts(
  ids: string[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, message: "Select at least one product." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id, metadata")
      .in("id", uniqueIds);

    if (fetchError) throw fetchError;

    for (const row of existing ?? []) {
      const metadata = {
        ...(row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {}),
        status: "active",
      };
      const { error } = await supabase
        .from("products")
        .update({ active: true, metadata })
        .eq("id", row.id);
      if (error) throw error;
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    const count = existing?.length ?? 0;
    return {
      success: true,
      message:
        count === 1
          ? "1 product restored."
          : `${count} products restored.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to restore products.",
    };
  }
}

export async function bulkDeleteProducts(
  ids: string[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      revalidatePath("/admin/products");
      return {
        success: true,
        message: "Products deleted (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, message: "Select at least one product." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .in("id", uniqueIds);

    if (error) throw error;

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    const deleted = count ?? uniqueIds.length;
    return {
      success: true,
      message:
        deleted === 1
          ? "1 product deleted permanently."
          : `${deleted} products deleted permanently.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to delete products.",
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return { success: false, message: "Order not found." };
    }

    const previousStatus = existing.status as OrderStatus;

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        ...(notes != null ? { internal_notes: notes } : {}),
        ...(status === "paid" ||
        status === "processing" ||
        status === "shipped" ||
        status === "delivered"
          ? { payment_status: "paid" }
          : {}),
        ...(status === "refunded" ? { payment_status: "refunded" } : {}),
        ...(status === "cancelled" ? { payment_status: "cancelled" } : {}),
      })
      .eq("id", orderId);

    if (error) throw error;

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status,
      notes: notes ?? null,
      created_by: auth.userId,
    });

    const {
      deductStockForOrder,
      restoreStockForOrder,
      orderStatusHoldsInventory,
      orderStatusReleasesInventory,
    } = await import("@/lib/catalog/inventory");

    const previouslyHeld = orderStatusHoldsInventory(previousStatus);
    const nowHolds = orderStatusHoldsInventory(status);
    const nowReleases = orderStatusReleasesInventory(status);

    if (!previouslyHeld && nowHolds) {
      await deductStockForOrder(
        supabase,
        orderId,
        `Admin status → ${status}`,
      );
    } else if (previouslyHeld && nowReleases) {
      await restoreStockForOrder(
        supabase,
        orderId,
        status === "refunded" ? "refund" : "cancellation",
        `Admin status → ${status}`,
      );
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true, message: "Order status updated." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update order.",
    };
  }
}

export async function updateOrderInternalNotes(
  orderId: string,
  internalNotes: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("orders")
      .update({ internal_notes: internalNotes })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Internal notes saved." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save notes.",
    };
  }
}

export type OrderShippingAddressInput = {
  first_name: string;
  last_name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  phone?: string;
};

export async function updateOrderShippingAddress(
  orderId: string,
  address: OrderShippingAddressInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const line1 = address.line1?.trim() ?? "";
  const city = address.city?.trim() ?? "";
  const state = address.state?.trim() ?? "";
  const postal = address.postal_code?.trim() ?? "";

  if (!line1 || !city || !state || !postal) {
    return {
      success: false,
      message: "Address needs street, city, state, and ZIP.",
    };
  }

  const shippingAddress = {
    first_name: address.first_name?.trim() || "",
    last_name: address.last_name?.trim() || "",
    company: address.company?.trim() || "",
    line1,
    line2: address.line2?.trim() || "",
    city,
    state,
    postal_code: postal,
    country: (address.country?.trim() || "US").toUpperCase(),
    phone: address.phone?.trim() || "",
  };

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();

    const { error } = await supabase
      .from("orders")
      .update({ shipping_address: shippingAddress })
      .eq("id", orderId);

    if (error) throw error;

    if (existing?.status) {
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        status: existing.status,
        notes: `Shipping address updated · ${line1}, ${city}, ${state} ${postal}`,
        created_by: auth.userId,
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Shipping address saved." };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to save shipping address.",
    };
  }
}

export type QuoteUpdateInput = {
  status?: QuoteStatus;
  internalNotes?: string;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  expiresAt?: string | null;
  items?: {
    id?: string;
    productId?: string | null;
    productName: string;
    sku?: string | null;
    quantity: number;
    unitPrice?: number | null;
    notes?: string | null;
  }[];
};

export async function updateQuote(
  quoteId: string,
  input: QuoteUpdateInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const patch: Record<string, unknown> = {};
    if (input.status) patch.status = input.status;
    if (input.internalNotes !== undefined) patch.internal_notes = input.internalNotes;
    if (input.discountAmount !== undefined) patch.discount_amount = input.discountAmount;
    if (input.shippingAmount !== undefined) patch.shipping_amount = input.shippingAmount;
    if (input.taxAmount !== undefined) patch.tax_amount = input.taxAmount;
    if (input.expiresAt !== undefined) patch.expires_at = input.expiresAt;

    if (input.items?.length) {
      const subtotal = input.items.reduce(
        (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
        0,
      );
      const discount = input.discountAmount ?? 0;
      const shipping = input.shippingAmount ?? 0;
      const tax = input.taxAmount ?? 0;
      patch.subtotal = subtotal;
      patch.total = subtotal - discount + shipping + tax;

      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      await supabase.from("quote_items").insert(
        input.items.map((item, index) => ({
          quote_id: quoteId,
          product_id: item.productId ?? null,
          product_name: item.productName,
          sku: item.sku ?? null,
          quantity: item.quantity,
          unit_price: item.unitPrice ?? null,
          notes: item.notes ?? null,
          sort_order: index,
        })),
      );
    }

    const { error } = await supabase
      .from("quotes")
      .update(patch as Database["public"]["Tables"]["quotes"]["Update"])
      .eq("id", quoteId);
    if (error) throw error;

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quoteId}`);
    return { success: true, message: "Quote updated." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update quote.",
    };
  }
}

export async function convertQuoteToOrder(quoteId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  let orderId: string;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: rawQuote, error: quoteError } = await supabase
      .from("quotes")
      .select("*, items:quote_items(*)")
      .eq("id", quoteId)
      .single();

    if (quoteError || !rawQuote) {
      return { success: false, message: "Quote not found." };
    }

    const quote = rawQuote as unknown as {
      id: string;
      quote_number: string;
      user_id: string | null;
      email: string;
      converted_order_id: string | null;
      subtotal: number | null;
      shipping_amount: number | null;
      tax_amount: number | null;
      discount_amount: number | null;
      total: number | null;
      shipping_address: Database["public"]["Tables"]["quotes"]["Row"]["shipping_address"];
      notes: string | null;
      items: {
        product_id: string | null;
        product_name: string;
        sku: string | null;
        quantity: number;
        unit_price: number | null;
      }[] | null;
    };

    if (quote.converted_order_id) {
      return { success: false, message: "Quote already converted." };
    }

    const items = quote.items ?? [];

    const subtotal =
      quote.subtotal ??
      items.reduce((s, i) => s + (i.unit_price ?? 0) * i.quantity, 0);
    const shipping = quote.shipping_amount ?? 0;
    const tax = quote.tax_amount ?? 0;
    const discount = quote.discount_amount ?? 0;
    const total = quote.total ?? subtotal - discount + shipping + tax;
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: quote.user_id,
        email: quote.email,
        status: "pending",
        payment_status: "unpaid",
        fulfillment_status: "unfulfilled",
        subtotal,
        shipping_amount: shipping,
        tax_amount: tax,
        discount_amount: discount,
        total,
        currency: "USD",
        shipping_address: quote.shipping_address,
        notes: quote.notes,
        internal_notes: `Converted from ${quote.quote_number}`,
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Order create failed");

    if (items.length) {
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku ?? "",
          quantity: item.quantity,
          unit_price: item.unit_price ?? 0,
          total_price: (item.unit_price ?? 0) * item.quantity,
        })),
      );
    }

    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: "pending",
      notes: `Converted from quote ${quote.quote_number}`,
      created_by: auth.userId,
    });

    await supabase
      .from("quotes")
      .update({ status: "converted", converted_order_id: order.id })
      .eq("id", quoteId);

    orderId = order.id;
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/orders");
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to convert quote.",
    };
  }

  redirect(`/admin/orders/${orderId}`);
}

export type CreateAdminOrderItemInput = {
  productId?: string | null;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
};

export type CreateAdminOrderInput = {
  email: string;
  status?: OrderStatus;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  internalNotes?: string;
  shippingAddress?: {
    first_name: string;
    last_name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    phone?: string;
  } | null;
  items: CreateAdminOrderItemInput[];
};

export async function createAdminOrder(
  input: CreateAdminOrderInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const email = input.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, message: "Enter a valid customer email." };
  }

  const items = (input.items ?? []).filter(
    (item) =>
      item.productName?.trim() &&
      Number(item.quantity) > 0 &&
      Number(item.unitPrice) >= 0,
  );

  if (items.length === 0) {
    return {
      success: false,
      message: "Add at least one line item with a name, qty, and price.",
    };
  }

  const status: OrderStatus = input.status ?? "pending";
  const shipping = Number(input.shippingAmount) || 0;
  const tax = Number(input.taxAmount) || 0;
  const discount = Number(input.discountAmount) || 0;
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  const total = Number(
    Math.max(0, subtotal - discount + shipping + tax).toFixed(2),
  );
  const orderNumber = generateOrderNumber();
  const paidLike = status === "paid" || status === "processing" || status === "shipped" || status === "delivered";

  let orderId: string;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    if (paidLike) {
      const { availableStockForLine } = await import("@/lib/catalog/inventory");
      for (const item of items) {
        if (!item.productId) continue;
        const { data: product } = await supabase
          .from("products")
          .select("id, name, inventory_quantity, metadata, low_stock_threshold")
          .eq("id", item.productId)
          .maybeSingle();
        if (!product) {
          return {
            success: false,
            message: `Product not found for line “${item.productName}”.`,
          };
        }
        const available = availableStockForLine(product);
        if (available < Number(item.quantity)) {
          return {
            success: false,
            message: `Insufficient stock for ${product.name} (have ${available}, need ${item.quantity}).`,
          };
        }
      }
    }
    const address = input.shippingAddress;
    const shippingAddress =
      address?.line1?.trim() && address.city?.trim()
        ? {
            first_name: address.first_name?.trim() || "",
            last_name: address.last_name?.trim() || "",
            company: address.company?.trim() || null,
            line1: address.line1.trim(),
            line2: address.line2?.trim() || null,
            city: address.city.trim(),
            state: address.state?.trim() || "",
            postal_code: address.postal_code?.trim() || "",
            country: address.country?.trim() || "US",
            phone: address.phone?.trim() || null,
          }
        : null;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        email,
        status,
        payment_status: paidLike ? "paid" : "unpaid",
        fulfillment_status:
          status === "shipped" || status === "delivered"
            ? "fulfilled"
            : "unfulfilled",
        subtotal: Number(subtotal.toFixed(2)),
        shipping_amount: shipping,
        tax_amount: tax,
        discount_amount: discount,
        total,
        currency: "USD",
        shipping_address: shippingAddress,
        internal_notes: input.internalNotes?.trim() || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Order create failed");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName.trim(),
        sku: item.sku?.trim() || "",
        quantity: Number(item.quantity),
        unit_price: Number(item.unitPrice),
        total_price: Number(
          (Number(item.unitPrice) * Number(item.quantity)).toFixed(2),
        ),
      })),
    );

    if (itemsError) throw itemsError;

    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status,
      notes: "Created manually in admin",
      created_by: auth.userId,
    });

    if (paidLike) {
      const { deductStockForOrder } = await import("@/lib/catalog/inventory");
      await deductStockForOrder(
        supabase,
        order.id,
        `Admin order ${orderNumber}`,
      );
    }

    orderId = order.id;
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to create order.",
    };
  }

  redirect(`/admin/orders/${orderId}`);
}

export async function saveSiteSettings(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    // Demo-friendly message when reviewing without Supabase
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: "Settings saved (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const siteName = String(formData.get("siteName") ?? "");
    const tagline = String(formData.get("tagline") ?? "");
    const supportEmail = String(formData.get("supportEmail") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const freeShippingRaw = String(
      formData.get("freeShippingThreshold") ?? "199",
    ).replace(/,/g, "");
    const freeShippingThreshold = Number(freeShippingRaw);
    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      return {
        success: false,
        message: "Enter a valid free shipping threshold.",
      };
    }

    const shipFromName = String(formData.get("shipFromName") ?? "").trim();
    const shipFromCompany = String(formData.get("shipFromCompany") ?? "").trim();
    const shipFromPhone = String(formData.get("shipFromPhone") ?? "").trim();
    const shipFromLine1 = String(formData.get("shipFromLine1") ?? "").trim();
    const shipFromLine2 = String(formData.get("shipFromLine2") ?? "").trim();
    const shipFromCity = String(formData.get("shipFromCity") ?? "").trim();
    const shipFromState = String(formData.get("shipFromState") ?? "")
      .trim()
      .toUpperCase();
    const shipFromPostal = String(formData.get("shipFromPostal") ?? "").trim();
    const shipFromCountry = String(formData.get("shipFromCountry") ?? "US")
      .trim()
      .toUpperCase() || "US";

    if (
      !shipFromName ||
      !shipFromLine1 ||
      !shipFromCity ||
      !shipFromState ||
      !shipFromPostal
    ) {
      return {
        success: false,
        message:
          "Complete the ShipEngine ship-from name, street, city, state, and ZIP.",
      };
    }

    const { SHIPENGINE_SHIP_FROM_KEY } = await import("@/lib/shipengine/config");

    const rows = [
      {
        key: "site_config",
        value: { name: siteName, tagline, supportEmail, phone },
      },
      {
        key: "free_shipping_threshold",
        value: { amount: freeShippingThreshold, currency: "usd" },
      },
      {
        key: SHIPENGINE_SHIP_FROM_KEY,
        value: {
          name: shipFromName,
          company: shipFromCompany,
          phone: shipFromPhone,
          line1: shipFromLine1,
          line2: shipFromLine2,
          city: shipFromCity,
          state: shipFromState,
          postalCode: shipFromPostal,
          country: shipFromCountry,
        },
      },
    ];

    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;

    revalidatePath("/admin/settings");
    revalidatePath("/admin/orders");
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/shipping");
    return { success: true, message: "Settings saved." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save settings.",
    };
  }
}

const RESET_PLATFORM_CONFIRMATION = "RESET";

/**
 * Wipes catalog/commerce + members/customers/dashboard data.
 * Keeps the master admin account and all brands (logos).
 */
export async function resetPlatform(
  confirmation: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: "Platform reset (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  if (confirmation.trim() !== RESET_PLATFORM_CONFIRMATION) {
    return {
      success: false,
      message: `Type ${RESET_PLATFORM_CONFIRMATION} to confirm the reset.`,
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const isMissingTable = (message: string) =>
      /Could not find the table|does not exist|schema cache/i.test(message);

    const clearAll = async (table: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (!error) return;
      // Optional / unmigrated tables should not block a platform wipe.
      if (isMissingTable(error.message)) return;
      throw new Error(`${table}: ${error.message}`);
    };

    // Commerce / quotes first (FK-safe order)
    await clearAll("quote_attachments");
    await clearAll("quote_items");
    await clearAll("quotes");
    await clearAll("coupon_redemptions");
    await clearAll("order_status_history");
    await clearAll("order_items");
    await clearAll("orders");
    await clearAll("cart_items");
    await clearAll("carts");
    await clearAll("wishlist_items");
    await clearAll("wishlists");
    await clearAll("reviews");
    await clearAll("inventory_movements");
    await clearAll("coupons");
    await clearAll("newsletter_subscribers");
    await clearAll("resources");
    await clearAll("affiliate_applications");
    await clearAll("addresses");

    // Catalog (child tables cascade from products). Brands/logos are kept.
    await clearAll("product_images");
    await clearAll("product_variants");
    await clearAll("product_specifications");
    await clearAll("products");

    const { error: categoryParentError } = await supabase
      .from("categories")
      .update({ parent_id: null })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (categoryParentError) throw categoryParentError;

    await clearAll("categories");

    // Custom platform settings (tags, etc.) — leave core store config alone
    const { error: settingsError } = await supabase
      .from("site_settings")
      .delete()
      .in("key", [
        "catalog_tags",
        "catalog_primary_tags",
        "catalog_tags_removed",
        "catalog_sizes",
        "catalog_departments",
        "catalog_primary_departments",
        "catalog_departments_removed",
        "catalog_offline_departments",
      ]);
    if (settingsError) throw settingsError;

    // Wipe members + customers; master admin always survives.
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email");
    if (profilesError) throw profilesError;

    const removableIds = (profiles ?? [])
      .filter((profile) => !isMasterAdminEmail(profile.email))
      .map((profile) => profile.id);

    for (const userId of removableIds) {
      const { error: deleteUserError } =
        await supabase.auth.admin.deleteUser(userId);
      if (
        deleteUserError &&
        !/not found|user not found/i.test(deleteUserError.message)
      ) {
        const { error: profileDeleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);
        if (profileDeleteError) {
          throw new Error(
            `profiles/${userId}: ${deleteUserError.message}; ${profileDeleteError.message}`,
          );
        }
      }
    }

    // Catch any leftover non-master profiles (e.g. auth user already gone).
    const { data: leftoverProfiles, error: leftoverFetchError } = await supabase
      .from("profiles")
      .select("id, email");
    if (leftoverFetchError) throw leftoverFetchError;

    const leftoverIds = (leftoverProfiles ?? [])
      .filter((profile) => !isMasterAdminEmail(profile.email))
      .map((profile) => profile.id);

    if (leftoverIds.length > 0) {
      const { error: leftoverProfilesError } = await supabase
        .from("profiles")
        .delete()
        .in("id", leftoverIds);
      if (leftoverProfilesError) throw leftoverProfilesError;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/quotes");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/members");
    revalidatePath("/admin/affiliates");
    revalidatePath("/admin/users");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/resources");
    revalidatePath("/admin/settings");
    revalidatePath("/shop");

    return {
      success: true,
      message:
        "Platform reset. Catalog, commerce, members, and customers were cleared. Master admin and brands were kept.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to reset platform.",
    };
  }
}

export async function importProductsCsv(
  formData: FormData,
): Promise<ActionResult & { imported?: number; updated?: number }> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: "CSV import acknowledged (demo). Connect Supabase to persist.",
        imported: 0,
        updated: 0,
      };
    }
    return auth.result;
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "Choose a CSV file to import." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "CSV must be 5 MB or smaller." };
  }

  try {
    const {
      parseCsv,
      parseBool,
      parseNumber,
    } = await import("@/lib/admin/products-csv");
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      return { success: false, message: "CSV has no data rows." };
    }

    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const [{ data: categories }, { data: brands }] = await Promise.all([
      supabase.from("categories").select("id, slug"),
      supabase.from("brands").select("id, slug"),
    ]);
    const categoryBySlug = new Map(
      (categories ?? []).map((c) => [c.slug.toLowerCase(), c.id]),
    );
    const brandBySlug = new Map(
      (brands ?? []).map((b) => [b.slug.toLowerCase(), b.id]),
    );

    let imported = 0;
    let updated = 0;
    const touchedBrandIds = new Set<string>();

    for (const row of rows) {
      const sku = row.sku?.trim();
      const name = row.name?.trim();
      if (!sku || !name) continue;

      const slug =
        row.slug?.trim() ||
        slugify(name) ||
        slugify(sku);

      const price = parseNumber(row.price ?? "");
      if (price == null || price < 0) continue;

      const brandId = row.brand_slug
        ? (brandBySlug.get(row.brand_slug.toLowerCase()) ?? null)
        : null;
      if (brandId) touchedBrandIds.add(brandId);

      const payload = {
        sku,
        name,
        slug,
        price,
        compare_at_price: parseNumber(row.compare_at_price ?? ""),
        cost: parseNumber(row.cost ?? ""),
        inventory_quantity: Math.max(
          0,
          Math.floor(parseNumber(row.inventory_quantity ?? "") ?? 0),
        ),
        low_stock_threshold: Math.max(
          0,
          Math.floor(parseNumber(row.low_stock_threshold ?? "") ?? 10),
        ),
        active: parseBool(row.active ?? "", true),
        featured: parseBool(row.featured ?? "", false),
        bestseller: parseBool(row.bestseller ?? "", false),
        product_type: row.product_type?.trim() || null,
        department: row.department?.trim() || null,
        ansi_class: row.ansi_class?.trim() || null,
        color: row.color?.trim() || null,
        size: row.size?.trim() || null,
        shipping_class: row.shipping_class?.trim() || null,
        weight: parseNumber(row.weight ?? ""),
        short_description: row.short_description?.trim() || null,
        description: row.description?.trim() || null,
        category_id: row.category_slug
          ? (categoryBySlug.get(row.category_slug.toLowerCase()) ?? null)
          : null,
        brand_id: brandId,
      };

      const { data: existing } = await supabase
        .from("products")
        .select("id, brand_id")
        .eq("sku", sku)
        .maybeSingle();

      if (existing?.brand_id) touchedBrandIds.add(existing.brand_id);

      if (existing?.id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
        updated += 1;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        imported += 1;
      }
    }

    await syncBrandActiveFromProducts(supabase, [...touchedBrandIds]);

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/brands");
    revalidatePath("/shop");
    revalidatePath("/");

    return {
      success: true,
      message: `Import complete — ${imported} created, ${updated} updated.`,
      imported,
      updated,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "CSV import failed.",
    };
  }
}

async function readCatalogTagsList(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  key: "catalog_tags" | "catalog_primary_tags" = "catalog_tags",
): Promise<string[]> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const value = data?.value as { tags?: unknown } | null;
  if (!Array.isArray(value?.tags)) return [];
  return value.tags
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
}

export async function createCatalogTag(
  name: string,
  source: "catalog" | "custom" = "custom",
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: "Tag name is required." };
  }
  const tagSource = source === "catalog" ? "catalog" : "custom";

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const {
        getDemoCatalogTags,
        setDemoCatalogTags,
        getDemoPrimaryCatalogTags,
        setDemoPrimaryCatalogTags,
        getDemoRemovedCatalogTags,
        setDemoRemovedCatalogTags,
      } = await import("@/lib/data/admin");
      const { PRODUCT_TAG_OPTIONS } = await import("@/lib/data/catalog-options");
      setDemoRemovedCatalogTags(
        getDemoRemovedCatalogTags().filter(
          (t) => t.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      const existing = new Set([
        ...PRODUCT_TAG_OPTIONS.map((o) => o.value.toLowerCase()),
        ...getDemoCatalogTags().map((t) => t.toLowerCase()),
        ...getDemoPrimaryCatalogTags().map((t) => t.toLowerCase()),
      ]);
      if (existing.has(trimmed.toLowerCase())) {
        return { success: false, message: "That tag already exists." };
      }
      if (tagSource === "catalog") {
        setDemoPrimaryCatalogTags([...getDemoPrimaryCatalogTags(), trimmed]);
      } else {
        setDemoCatalogTags([...getDemoCatalogTags(), trimmed]);
      }
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      return {
        success: true,
        message: "Tag added (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const { PRODUCT_TAG_OPTIONS } = await import("@/lib/data/catalog-options");
    const supabase = createServiceClient();
    const [currentCustom, currentPrimary] = await Promise.all([
      readCatalogTagsList(supabase, "catalog_tags"),
      readCatalogTagsList(supabase, "catalog_primary_tags"),
    ]);
    const existing = new Set([
      ...PRODUCT_TAG_OPTIONS.map((o) => o.value.toLowerCase()),
      ...currentCustom.map((t) => t.toLowerCase()),
      ...currentPrimary.map((t) => t.toLowerCase()),
    ]);

    const { data: removedRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "catalog_tags_removed")
      .maybeSingle();
    const removedValue = removedRow?.value as { tags?: unknown } | null;
    const removed = Array.isArray(removedValue?.tags)
      ? removedValue.tags
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim())
      : [];
    const wasRemoved = removed.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );
    if (wasRemoved) {
      await supabase.from("site_settings").upsert(
        {
          key: "catalog_tags_removed",
          value: {
            tags: removed.filter(
              (t) => t.toLowerCase() !== trimmed.toLowerCase(),
            ),
          },
        },
        { onConflict: "key" },
      );
    }

    if (existing.has(trimmed.toLowerCase()) && !wasRemoved) {
      return { success: false, message: "That tag already exists." };
    }

    if (!existing.has(trimmed.toLowerCase())) {
      if (tagSource === "catalog") {
        await writeCatalogTagsList(supabase, [...currentPrimary, trimmed], "catalog_primary_tags");
      } else {
        await writeCatalogTagsList(supabase, [...currentCustom, trimmed], "catalog_tags");
      }
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, message: "Tag added." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to add tag.",
    };
  }
}

async function writeCatalogTagsList(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  tags: string[],
  key: "catalog_tags" | "catalog_primary_tags" = "catalog_tags",
) {
  const { error } = await supabase.from("site_settings").upsert(
    { key, value: { tags } },
    { onConflict: "key" },
  );
  if (error) throw error;
}

/**
 * Adds a size to the shared catalog list so it is selectable on every product,
 * not just the one being edited.
 */
export async function addCatalogSize(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: "Size name is required." };
  }
  if (trimmed.length > 24) {
    return { success: false, message: "Size must be 24 characters or fewer." };
  }

  const { SIZE_OPTIONS } = await import("@/lib/data/catalog-options");
  const isCanonical = SIZE_OPTIONS.some(
    (o) => o.value.toLowerCase() === trimmed.toLowerCase(),
  );

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const { getDemoCatalogSizes, setDemoCatalogSizes } = await import(
        "@/lib/data/admin"
      );
      const current = getDemoCatalogSizes();
      const exists =
        isCanonical ||
        current.some((s) => s.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return { success: false, message: "That size already exists." };
      }
      setDemoCatalogSizes([...current, trimmed]);
      revalidatePath("/admin/products");
      return {
        success: true,
        message: "Size added (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "catalog_sizes")
      .maybeSingle();
    const value = data?.value as { sizes?: unknown } | null;
    const current = Array.isArray(value?.sizes)
      ? value.sizes
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim())
      : [];

    const exists =
      isCanonical ||
      current.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, message: "That size already exists." };
    }

    const { error } = await supabase.from("site_settings").upsert(
      { key: "catalog_sizes", value: { sizes: [...current, trimmed] } },
      { onConflict: "key" },
    );
    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, message: `Size "${trimmed}" added to all products.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to add size.",
    };
  }
}

/**
 * Adds a department to the shared catalog list so it is selectable on products
 * and available in shop filters (unless marked off-line).
 */
export async function addCatalogDepartment(
  name: string,
  source: "catalog" | "custom" | "offline" = "custom",
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: "Department name is required." };
  }
  if (trimmed.length > 48) {
    return {
      success: false,
      message: "Department must be 48 characters or fewer.",
    };
  }
  const departmentSource =
    source === "catalog"
      ? "catalog"
      : source === "offline"
        ? "offline"
        : "custom";

  const { DEPARTMENT_OPTIONS } = await import("@/lib/data/catalog-options");

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const {
        getDemoCatalogDepartments,
        setDemoCatalogDepartments,
        getDemoPrimaryCatalogDepartments,
        setDemoPrimaryCatalogDepartments,
        getDemoOfflineCatalogDepartments,
        setDemoOfflineCatalogDepartments,
        getDemoRemovedCatalogDepartments,
        setDemoRemovedCatalogDepartments,
      } = await import("@/lib/data/admin");
      setDemoRemovedCatalogDepartments(
        getDemoRemovedCatalogDepartments().filter(
          (d) => d.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      const custom = getDemoCatalogDepartments();
      const primary = getDemoPrimaryCatalogDepartments();
      const offline = getDemoOfflineCatalogDepartments();
      const isCanonical = DEPARTMENT_OPTIONS.some(
        (o) => o.value.toLowerCase() === trimmed.toLowerCase(),
      );
      const exists =
        isCanonical ||
        custom.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
        primary.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
        offline.some((d) => d.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        // Restoring a previously removed built-in is enough.
        if (isCanonical) {
          revalidatePath("/admin/categories");
          revalidatePath("/admin/products");
          revalidatePath("/shop");
          return {
            success: true,
            message: "Department restored (demo). Connect Supabase to persist.",
          };
        }
        return { success: false, message: "That department already exists." };
      }
      if (departmentSource === "catalog") {
        setDemoPrimaryCatalogDepartments([...primary, trimmed]);
      } else if (departmentSource === "offline") {
        setDemoOfflineCatalogDepartments([...offline, trimmed]);
      } else {
        setDemoCatalogDepartments([...custom, trimmed]);
      }
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      revalidatePath("/shop");
      return {
        success: true,
        message: "Department added (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const [customRow, primaryRow, offlineRow, removedRow] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_primary_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_offline_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments_removed")
        .maybeSingle(),
    ]);
    const readList = (row: { data: { value: unknown } | null }) => {
      const value = row.data?.value as { departments?: unknown } | null;
      return Array.isArray(value?.departments)
        ? value.departments
            .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
            .map((d) => d.trim())
        : [];
    };
    const currentCustom = readList(customRow);
    const currentPrimary = readList(primaryRow);
    const currentOffline = readList(offlineRow);
    const currentRemoved = readList(removedRow);
    const nextRemoved = currentRemoved.filter(
      (d) => d.toLowerCase() !== trimmed.toLowerCase(),
    );
    const wasRemoved = nextRemoved.length !== currentRemoved.length;

    const { error: removedError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_departments_removed",
        value: { departments: sortDepartmentNames(nextRemoved) },
      },
      { onConflict: "key" },
    );
    if (removedError) throw removedError;

    const isCanonical = DEPARTMENT_OPTIONS.some(
      (o) => o.value.toLowerCase() === trimmed.toLowerCase(),
    );
    const exists =
      isCanonical ||
      currentCustom.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
      currentPrimary.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
      currentOffline.some((d) => d.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      if (isCanonical && wasRemoved) {
        revalidatePath("/admin/categories");
        revalidatePath("/admin/products");
        revalidatePath("/shop");
        return {
          success: true,
          message: `Department "${trimmed}" restored.`,
        };
      }
      return { success: false, message: "That department already exists." };
    }

    const key =
      departmentSource === "catalog"
        ? "catalog_primary_departments"
        : departmentSource === "offline"
          ? "catalog_offline_departments"
          : "catalog_departments";
    const next = sortDepartmentNames(
      departmentSource === "catalog"
        ? [...currentPrimary, trimmed]
        : departmentSource === "offline"
          ? [...currentOffline, trimmed]
          : [...currentCustom, trimmed],
    );

    const { error } = await supabase.from("site_settings").upsert(
      { key, value: { departments: next } },
      { onConflict: "key" },
    );
    if (error) throw error;

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return {
      success: true,
      message: `Department "${trimmed}" added.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to add department.",
    };
  }
}

/** Renames a department and/or changes its catalog / custom / off-line source. */
export async function renameCatalogDepartment(
  oldName: string,
  newName: string,
  source: "catalog" | "custom" | "offline" = "custom",
): Promise<ActionResult> {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to) {
    return { success: false, message: "Department name is required." };
  }
  if (to.length > 48) {
    return {
      success: false,
      message: "Department must be 48 characters or fewer.",
    };
  }
  const departmentSource =
    source === "catalog"
      ? "catalog"
      : source === "offline"
        ? "offline"
        : "custom";

  const { DEPARTMENT_OPTIONS } = await import("@/lib/data/catalog-options");
  const toIsBuiltIn = DEPARTMENT_OPTIONS.some(
    (o) => o.value.toLowerCase() === to.toLowerCase(),
  );

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const {
        getDemoCatalogDepartments,
        setDemoCatalogDepartments,
        getDemoPrimaryCatalogDepartments,
        setDemoPrimaryCatalogDepartments,
        getDemoOfflineCatalogDepartments,
        setDemoOfflineCatalogDepartments,
        getDemoRemovedCatalogDepartments,
        setDemoRemovedCatalogDepartments,
      } = await import("@/lib/data/admin");

      setDemoRemovedCatalogDepartments(
        getDemoRemovedCatalogDepartments().filter(
          (d) =>
            d.toLowerCase() !== from.toLowerCase() &&
            d.toLowerCase() !== to.toLowerCase(),
        ),
      );

      let custom = getDemoCatalogDepartments().filter(
        (d) => d.toLowerCase() !== from.toLowerCase(),
      );
      let primary = getDemoPrimaryCatalogDepartments().filter(
        (d) => d.toLowerCase() !== from.toLowerCase(),
      );
      let offline = getDemoOfflineCatalogDepartments().filter(
        (d) => d.toLowerCase() !== from.toLowerCase(),
      );

      const nameTaken =
        to.toLowerCase() !== from.toLowerCase() &&
        (toIsBuiltIn ||
          custom.some((d) => d.toLowerCase() === to.toLowerCase()) ||
          primary.some((d) => d.toLowerCase() === to.toLowerCase()) ||
          offline.some((d) => d.toLowerCase() === to.toLowerCase()));
      if (nameTaken) {
        return { success: false, message: "That department already exists." };
      }

      if (departmentSource === "catalog") {
        if (!toIsBuiltIn) primary = [...primary, to];
      } else if (departmentSource === "offline") {
        offline = [...offline, to];
      } else if (!toIsBuiltIn) {
        custom = [...custom, to];
      }

      setDemoCatalogDepartments(custom);
      setDemoPrimaryCatalogDepartments(primary);
      setDemoOfflineCatalogDepartments(offline);
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      revalidatePath("/shop");
      return {
        success: true,
        message: "Department updated (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const [customRow, primaryRow, offlineRow, removedRow] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_primary_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_offline_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments_removed")
        .maybeSingle(),
    ]);

    const readList = (row: { data: { value: unknown } | null }) => {
      const value = row.data?.value as { departments?: unknown } | null;
      return Array.isArray(value?.departments)
        ? value.departments
            .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
            .map((d) => d.trim())
        : [];
    };

    let custom = readList(customRow).filter(
      (d) => d.toLowerCase() !== from.toLowerCase(),
    );
    let primary = readList(primaryRow).filter(
      (d) => d.toLowerCase() !== from.toLowerCase(),
    );
    let offline = readList(offlineRow).filter(
      (d) => d.toLowerCase() !== from.toLowerCase(),
    );
    const removed = readList(removedRow).filter(
      (d) =>
        d.toLowerCase() !== from.toLowerCase() &&
        d.toLowerCase() !== to.toLowerCase(),
    );

    const nameTaken =
      to.toLowerCase() !== from.toLowerCase() &&
      (toIsBuiltIn ||
        custom.some((d) => d.toLowerCase() === to.toLowerCase()) ||
        primary.some((d) => d.toLowerCase() === to.toLowerCase()) ||
        offline.some((d) => d.toLowerCase() === to.toLowerCase()));
    if (nameTaken) {
      return { success: false, message: "That department already exists." };
    }

    if (departmentSource === "catalog") {
      if (!toIsBuiltIn) primary = [...primary, to];
    } else if (departmentSource === "offline") {
      offline = [...offline, to];
    } else if (!toIsBuiltIn) {
      custom = [...custom, to];
    }

    const { error: customError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_departments",
        value: { departments: sortDepartmentNames(custom) },
      },
      { onConflict: "key" },
    );
    if (customError) throw customError;
    const { error: primaryError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_primary_departments",
        value: { departments: sortDepartmentNames(primary) },
      },
      { onConflict: "key" },
    );
    if (primaryError) throw primaryError;
    const { error: offlineError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_offline_departments",
        value: { departments: sortDepartmentNames(offline) },
      },
      { onConflict: "key" },
    );
    if (offlineError) throw offlineError;
    const { error: removedError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_departments_removed",
        value: { departments: sortDepartmentNames(removed) },
      },
      { onConflict: "key" },
    );
    if (removedError) throw removedError;

    if (from.toLowerCase() !== to.toLowerCase()) {
      await remapProductDepartments(supabase, from, to);
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return {
      success: true,
      message:
        from.toLowerCase() === to.toLowerCase()
          ? `Department source updated to ${departmentSource === "offline" ? "off-line" : departmentSource}.`
          : `Department renamed to "${to}".`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to update department.",
    };
  }
}

/** Removes a department from the catalog list and clears it on products. */
export async function deleteCatalogDepartment(
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: "Department name is required." };
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const {
        getDemoCatalogDepartments,
        setDemoCatalogDepartments,
        getDemoPrimaryCatalogDepartments,
        setDemoPrimaryCatalogDepartments,
        getDemoOfflineCatalogDepartments,
        setDemoOfflineCatalogDepartments,
        getDemoRemovedCatalogDepartments,
        setDemoRemovedCatalogDepartments,
      } = await import("@/lib/data/admin");
      setDemoCatalogDepartments(
        getDemoCatalogDepartments().filter(
          (d) => d.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      setDemoPrimaryCatalogDepartments(
        getDemoPrimaryCatalogDepartments().filter(
          (d) => d.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      setDemoOfflineCatalogDepartments(
        getDemoOfflineCatalogDepartments().filter(
          (d) => d.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      const removed = getDemoRemovedCatalogDepartments();
      if (!removed.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
        setDemoRemovedCatalogDepartments([...removed, trimmed]);
      }
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      revalidatePath("/shop");
      return {
        success: true,
        message: "Department removed (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const [customRow, primaryRow, offlineRow, removedRow] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_primary_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_offline_departments")
        .maybeSingle(),
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments_removed")
        .maybeSingle(),
    ]);
    const customValue = customRow.data?.value as { departments?: unknown } | null;
    const primaryValue = primaryRow.data?.value as {
      departments?: unknown;
    } | null;
    const offlineValue = offlineRow.data?.value as {
      departments?: unknown;
    } | null;
    const removedValue = removedRow.data?.value as {
      departments?: unknown;
    } | null;
    const currentCustom = Array.isArray(customValue?.departments)
      ? customValue.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim())
      : [];
    const currentPrimary = Array.isArray(primaryValue?.departments)
      ? primaryValue.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim())
      : [];
    const currentOffline = Array.isArray(offlineValue?.departments)
      ? offlineValue.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim())
      : [];
    const currentRemoved = Array.isArray(removedValue?.departments)
      ? removedValue.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim())
      : [];

    const nextCustom = currentCustom.filter(
      (d) => d.toLowerCase() !== trimmed.toLowerCase(),
    );
    const nextPrimary = currentPrimary.filter(
      (d) => d.toLowerCase() !== trimmed.toLowerCase(),
    );
    const nextOffline = currentOffline.filter(
      (d) => d.toLowerCase() !== trimmed.toLowerCase(),
    );
    const nextRemoved = currentRemoved.some(
      (d) => d.toLowerCase() === trimmed.toLowerCase(),
    )
      ? currentRemoved
      : [...currentRemoved, trimmed];

    const { error: customError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_departments",
        value: { departments: sortDepartmentNames(nextCustom) },
      },
      { onConflict: "key" },
    );
    if (customError) throw customError;
    const { error: primaryError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_primary_departments",
        value: { departments: sortDepartmentNames(nextPrimary) },
      },
      { onConflict: "key" },
    );
    if (primaryError) throw primaryError;
    const { error: offlineError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_offline_departments",
        value: { departments: sortDepartmentNames(nextOffline) },
      },
      { onConflict: "key" },
    );
    if (offlineError) throw offlineError;
    const { error: removedError } = await supabase.from("site_settings").upsert(
      {
        key: "catalog_departments_removed",
        value: { departments: sortDepartmentNames(nextRemoved) },
      },
      { onConflict: "key" },
    );
    if (removedError) throw removedError;

    await remapProductDepartments(supabase, trimmed, null);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return {
      success: true,
      message: `Department "${trimmed}" removed.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to remove department.",
    };
  }
}

async function remapProductDepartments(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  fromName: string,
  toName: string | null,
) {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, department");
  if (error) throw error;

  const fromKey = fromName.toLowerCase();
  for (const product of products ?? []) {
    const current =
      typeof product.department === "string" ? product.department.trim() : "";
    if (current.toLowerCase() !== fromKey) continue;
    const { error: updateError } = await supabase
      .from("products")
      .update({ department: toName })
      .eq("id", product.id);
    if (updateError) throw updateError;
  }
}

async function remapProductTags(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>
  >,
  fromName: string,
  toName: string | null,
) {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, metadata");
  if (error) throw error;

  const fromKey = fromName.toLowerCase();
  for (const product of products ?? []) {
    const raw = product.metadata;
    const metadata: Record<string, unknown> =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? { ...(raw as Record<string, unknown>) }
        : {};
    const currentTags = Array.isArray(metadata.tags)
      ? metadata.tags.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    const nextTags = currentTags
      .map((tag) => (tag.trim().toLowerCase() === fromKey ? toName : tag))
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag?.trim()));
    const hadLegacy =
      typeof metadata.tag === "string" &&
      metadata.tag.trim().toLowerCase() === fromKey;
    if (
      !hadLegacy &&
      !currentTags.some((tag) => tag.trim().toLowerCase() === fromKey)
    ) {
      continue;
    }
    if (toName) {
      if (!nextTags.some((tag) => tag.trim().toLowerCase() === toName.toLowerCase())) {
        nextTags.push(toName);
      }
      metadata.tag = nextTags[0] ?? toName;
      metadata.tags = nextTags;
    } else {
      metadata.tag = nextTags[0] ?? null;
      metadata.tags = nextTags;
    }
    const { error: updateError } = await supabase
      .from("products")
      .update({
        metadata: metadata as import("@/types/database").Json,
      })
      .eq("id", product.id);
    if (updateError) throw updateError;
  }
}

export async function renameCatalogTag(
  oldName: string,
  newName: string,
): Promise<ActionResult> {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to) {
    return { success: false, message: "Tag name is required." };
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    return { success: true, message: "Tag unchanged." };
  }

  const { PRODUCT_TAG_OPTIONS } = await import("@/lib/data/catalog-options");
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const { getDemoCatalogTags, setDemoCatalogTags } = await import(
        "@/lib/data/admin"
      );
      const existing = new Set([
        ...PRODUCT_TAG_OPTIONS.map((o) => o.value.toLowerCase()),
        ...getDemoCatalogTags().map((t) => t.toLowerCase()),
      ]);
      if (existing.has(to.toLowerCase())) {
        return { success: false, message: "That tag already exists." };
      }
      const current = getDemoCatalogTags();
      const replaced = current.map((t) =>
        t.toLowerCase() === from.toLowerCase() ? to : t,
      );
      const hadCustom = current.some(
        (t) => t.toLowerCase() === from.toLowerCase(),
      );
      setDemoCatalogTags(hadCustom ? replaced : [...replaced, to]);
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      return {
        success: true,
        message: "Tag renamed (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const current = await readCatalogTagsList(supabase);
    const existing = new Set([
      ...PRODUCT_TAG_OPTIONS.map((o) => o.value.toLowerCase()),
      ...current.map((t) => t.toLowerCase()),
    ]);
    if (existing.has(to.toLowerCase())) {
      return { success: false, message: "That tag already exists." };
    }

    let next = current.map((t) =>
      t.toLowerCase() === from.toLowerCase() ? to : t,
    );
    if (
      !current.some((t) => t.toLowerCase() === from.toLowerCase()) &&
      !PRODUCT_TAG_OPTIONS.some((o) => o.value.toLowerCase() === from.toLowerCase())
    ) {
      next = [...next, to];
    } else if (
      !current.some((t) => t.toLowerCase() === from.toLowerCase()) &&
      PRODUCT_TAG_OPTIONS.some((o) => o.value.toLowerCase() === from.toLowerCase())
    ) {
      // Renaming a built-in label used on products — keep custom alias
      next = [...next, to];
    }

    await writeCatalogTagsList(supabase, next);
    await remapProductTags(supabase, from, to);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, message: "Tag renamed." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to rename tag.",
    };
  }
}

export async function deleteCatalogTag(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: "Tag name is required." };
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const {
        getDemoCatalogTags,
        setDemoCatalogTags,
        getDemoPrimaryCatalogTags,
        setDemoPrimaryCatalogTags,
        getDemoRemovedCatalogTags,
        setDemoRemovedCatalogTags,
      } = await import("@/lib/data/admin");
      setDemoCatalogTags(
        getDemoCatalogTags().filter(
          (t) => t.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      setDemoPrimaryCatalogTags(
        getDemoPrimaryCatalogTags().filter(
          (t) => t.toLowerCase() !== trimmed.toLowerCase(),
        ),
      );
      const removed = getDemoRemovedCatalogTags();
      if (!removed.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        setDemoRemovedCatalogTags([...removed, trimmed]);
      }
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
      return {
        success: true,
        message: "Tag removed (demo). Connect Supabase to persist.",
      };
    }
    return auth.result;
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const current = await readCatalogTagsList(supabase, "catalog_tags");
    const next = current.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase(),
    );
    await writeCatalogTagsList(supabase, next, "catalog_tags");

    const primary = await readCatalogTagsList(supabase, "catalog_primary_tags");
    const nextPrimary = primary.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase(),
    );
    await writeCatalogTagsList(supabase, nextPrimary, "catalog_primary_tags");

    const { data: removedRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "catalog_tags_removed")
      .maybeSingle();
    const removedValue = removedRow?.value as { tags?: unknown } | null;
    const removed = Array.isArray(removedValue?.tags)
      ? removedValue.tags
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim())
      : [];
    if (!removed.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      await supabase.from("site_settings").upsert(
        {
          key: "catalog_tags_removed",
          value: { tags: [...removed, trimmed] },
        },
        { onConflict: "key" },
      );
    }

    await remapProductTags(supabase, trimmed, null);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, message: "Tag removed." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to remove tag.",
    };
  }
}

export async function updateCustomer(
  customerId: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    phone?: string;
    state?: string;
    postalCode?: string;
  },
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    return { success: false, message: "Name and email are required." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", customerId)
      .maybeSingle();

    if (!profile || String(profile.role ?? "").toLowerCase() !== "customer") {
      return { success: false, message: "Customer not found." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        company: input.company?.trim() || null,
        phone: input.phone?.trim() || null,
        state: input.state?.trim() || null,
        postal_code: input.postalCode?.trim() || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", customerId);

    if (profileError) {
      return { success: false, message: profileError.message };
    }

    if (email !== String(profile.email ?? "").toLowerCase()) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        customerId,
        { email },
      );
      if (authError) {
        return {
          success: false,
          message: `Profile updated, but email auth sync failed: ${authError.message}`,
        };
      }
    }

    revalidatePath("/admin/customers");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true, message: "Customer updated." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update customer.",
    };
  }
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  if (auth.userId === customerId) {
    return { success: false, message: "You cannot delete your own account." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", customerId)
      .maybeSingle();

    if (!profile || String(profile.role ?? "").toLowerCase() !== "customer") {
      return { success: false, message: "Customer not found." };
    }

    const { error } = await supabase.auth.admin.deleteUser(customerId);
    if (error) {
      await supabase.from("profiles").delete().eq("id", customerId);
      if (error.message && !/not found|user not found/i.test(error.message)) {
        return { success: false, message: error.message };
      }
    }

    revalidatePath("/admin/customers");
    revalidatePath("/admin/users");
    return { success: true, message: "Customer deleted." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete customer.",
    };
  }
}

export async function sendCustomerPasswordReset(
  customerId: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", customerId)
      .maybeSingle();

    if (
      !profile?.email ||
      String(profile.role ?? "").toLowerCase() !== "customer"
    ) {
      return { success: false, message: "Customer not found." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: absoluteUrl("/auth/callback?next=/account/profile"),
    });
    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: `Password reset email sent to ${profile.email}.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to send password reset.",
    };
  }
}

/** Live profiles.role check constraint accepts Customer | Administrator | Support. */
const MEMBER_ROLE = "Administrator";

type ServiceClient = ReturnType<
  typeof import("@/lib/supabase/admin").createServiceClient
>;

/**
 * Aligns a member's affiliate coupon with their profile: the code they were
 * given, and the admin discount rate configured on /admin/members.
 */
async function syncMemberCoupon(
  supabase: ServiceClient,
  memberId: string,
  promoCode: string | null,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("affiliate_coupon_id")
    .eq("id", memberId)
    .maybeSingle();

  const couponId = profile?.affiliate_coupon_id;
  if (!couponId) return;

  const { getPromoDiscountSettings } = await import("@/lib/data/admin");
  const { adminPercent } = await getPromoDiscountSettings();

  await supabase
    .from("coupons")
    .update({
      ...(promoCode ? { code: promoCode } : {}),
      discount_type: "percent",
      discount_value: adminPercent,
    } as never)
    .eq("id", couponId);
}

export async function updatePromoDiscounts(input: {
  customerPercent: number;
  adminPercent: number;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  // Coupons carry a CHECK (discount_value > 0), so 0% cannot be stored.
  const inRange = (n: number) => Number.isFinite(n) && n > 0 && n <= 100;
  if (!inRange(input.customerPercent) || !inRange(input.adminPercent)) {
    return {
      success: false,
      message: "Discounts must be greater than 0% and at most 100%.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { error } = await supabase.from("site_settings").upsert(
      [
        {
          key: "promo_discounts",
          value: {
            customer: input.customerPercent,
            admin: input.adminPercent,
          },
        },
      ],
      { onConflict: "key" },
    );
    if (error) throw error;

    const { data: updated, error: rpcError } = await supabase.rpc(
      "apply_affiliate_discounts",
      {
        p_customer_percent: input.customerPercent,
        p_admin_percent: input.adminPercent,
      },
    );
    if (rpcError) throw rpcError;

    const count = Number(updated ?? 0);
    revalidatePath("/admin/settings");
    revalidatePath("/admin/members");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/users");
    return {
      success: true,
      message: `Promo discounts saved. ${count} promo code${
        count === 1 ? "" : "s"
      } updated.`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to save promo discounts.",
    };
  }
}

export async function setMaintenanceMode(input: {
  enabled: boolean;
  headline?: string;
  message?: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const headline =
    input.headline?.trim() || DEFAULT_MAINTENANCE_HEADLINE;
  const message = input.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { error } = await supabase.from("site_settings").upsert(
      [
        {
          key: MAINTENANCE_SETTINGS_KEY,
          value: {
            enabled: input.enabled,
            headline,
            message,
            startedAt: input.enabled ? new Date().toISOString() : null,
          },
        },
      ],
      { onConflict: "key" },
    );
    if (error) throw error;

    // Every storefront route renders the maintenance check in its layout.
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return {
      success: true,
      message: input.enabled
        ? "Site is offline. Visitors now see the maintenance page."
        : "Site is back online.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to change maintenance mode.",
    };
  }
}

export async function saveSupportChatSettings(input: {
  widgetEnabled: boolean;
  aiEnabled: boolean;
  presence: "auto" | "online" | "offline";
  schedule?: unknown;
  hoursLabel?: string;
  greeting?: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const {
    DEFAULT_SUPPORT_CHAT_GREETING,
    SUPPORT_CHAT_SETTINGS_KEY,
  } = await import("@/lib/data/support-chat-settings-shared");
  const {
    formatSupportHoursLabel,
    normalizeSupportSchedule,
  } = await import("@/lib/support/hours");

  const presence =
    input.presence === "online" || input.presence === "offline"
      ? input.presence
      : "auto";
  const schedule = normalizeSupportSchedule(
    input.schedule as Parameters<typeof normalizeSupportSchedule>[0],
  );
  const hoursLabel =
    input.hoursLabel?.trim() || formatSupportHoursLabel(schedule);

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { error } = await supabase.from("site_settings").upsert(
      [
        {
          key: SUPPORT_CHAT_SETTINGS_KEY,
          value: {
            widgetEnabled: input.widgetEnabled,
            aiEnabled: input.aiEnabled,
            presence,
            schedule,
            hoursLabel,
            greeting: input.greeting?.trim() || DEFAULT_SUPPORT_CHAT_GREETING,
          },
        },
      ],
      { onConflict: "key" },
    );
    if (error) throw error;

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/account");

    return {
      success: true,
      message: "Support chat settings saved.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to save support chat settings.",
    };
  }
}

/** Re-run API stack probes. Sticky lights only upgrade to green when healthy. */
export async function recheckApiStacks(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (!isSupabaseConfigured()) {
      const { getApiStackReports } = await import("@/lib/data/api-stacks");
      await getApiStackReports();
      revalidatePath("/admin/settings");
      return { success: true, message: "API stacks rechecked." };
    }
    return auth.result;
  }

  try {
    const { getApiStackReports } = await import("@/lib/data/api-stacks");
    await getApiStackReports();
    revalidatePath("/admin/settings");
    return {
      success: true,
      message:
        "API stacks rechecked. Lights only turn green when the probe confirms the issue is resolved.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to recheck API stacks.",
    };
  }
}

export async function reviewAffiliateApplication(input: {
  applicationId: string;
  decision: "approved" | "declined";
  note?: string;
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: application, error: readError } = await supabase
      .from("affiliate_applications")
      .select("id, user_id")
      .eq("id", input.applicationId)
      .maybeSingle();
    if (readError) throw readError;
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    const { error } = await supabase
      .from("affiliate_applications")
      .update({
        status: input.decision,
        admin_note: input.note?.trim() || null,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);
    if (error) throw error;

    if (input.decision === "approved") {
      // Approval must leave the affiliate with a live, shareable code.
      await supabase.rpc("ensure_affiliate_promo_for_profile", {
        p_profile_id: application.user_id,
      });
      const { data: profile } = await supabase
        .from("profiles")
        .select("affiliate_coupon_id")
        .eq("id", application.user_id)
        .maybeSingle();
      if (profile?.affiliate_coupon_id) {
        await supabase
          .from("coupons")
          .update({ active: true })
          .eq("id", profile.affiliate_coupon_id);
      }
    }

    revalidatePath("/admin/affiliates");
    revalidatePath("/admin/customers");
    revalidatePath("/affiliates");
    revalidatePath("/admin/users");

    return {
      success: true,
      message:
        input.decision === "approved"
          ? "Affiliate approved. Their code is now active."
          : "Application declined.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to update the application.",
    };
  }
}

export async function createMember(
  raw: MemberFormInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = memberFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid member data.",
    };
  }

  const password = parsed.data.password?.trim() ?? "";
  if (password.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters.",
    };
  }

  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const promoCode = parsed.data.promoCode?.trim().toUpperCase() || null;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: created, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone: parsed.data.phone?.trim() || null,
        },
      });

    if (authError || !created.user) {
      return {
        success: false,
        message: authError?.message ?? "Failed to create login.",
      };
    }

    const memberId = created.user.id;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        phone: parsed.data.phone?.trim() || null,
        date_of_birth: parsed.data.dateOfBirth?.trim() || null,
        avatar_url: parsed.data.avatarUrl?.trim() || null,
        role: MEMBER_ROLE,
        ...(promoCode ? { promo_code: promoCode } : {}),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", memberId);

    if (profileError) {
      return {
        success: false,
        message: `Login created, but profile update failed: ${profileError.message}`,
      };
    }

    await syncMemberCoupon(supabase, memberId, promoCode);

    revalidatePath("/admin/members");
    revalidatePath("/admin/users");
    return { success: true, message: "Member added.", id: memberId };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to add member.",
    };
  }
}

export async function updateMember(
  memberId: string,
  raw: MemberFormInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = memberFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid member data.",
    };
  }

  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const promoCode = parsed.data.promoCode?.trim().toUpperCase() || null;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", memberId)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: "Member not found." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        phone: parsed.data.phone?.trim() || null,
        date_of_birth: parsed.data.dateOfBirth?.trim() || null,
        avatar_url: parsed.data.avatarUrl?.trim() || null,
        role: MEMBER_ROLE,
        ...(promoCode ? { promo_code: promoCode } : {}),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", memberId);

    if (profileError) {
      return { success: false, message: profileError.message };
    }

    await syncMemberCoupon(supabase, memberId, promoCode);

    const password = parsed.data.password?.trim();
    const emailChanged = email !== String(profile.email ?? "").toLowerCase();

    if (emailChanged || (password && password.length >= 8)) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        memberId,
        {
          ...(emailChanged ? { email } : {}),
          ...(password && password.length >= 8 ? { password } : {}),
        },
      );
      if (authError) {
        return {
          success: false,
          message: `Profile updated, but login sync failed: ${authError.message}`,
        };
      }
    }

    revalidatePath("/admin/members");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/members/${memberId}`);
    revalidatePath(`/admin/members/${memberId}/edit`);
    return { success: true, message: "Member updated.", id: memberId };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update member.",
    };
  }
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  if (memberId === auth.userId) {
    return {
      success: false,
      message: "You cannot remove your own admin account.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", memberId)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: "Member not found." };
    }

    if (isMasterAdminEmail(profile.email)) {
      return {
        success: false,
        message: "The master admin account cannot be removed.",
      };
    }

    const { error } = await supabase.auth.admin.deleteUser(memberId);
    if (error) {
      await supabase.from("profiles").delete().eq("id", memberId);
      if (error.message && !/not found|user not found/i.test(error.message)) {
        return { success: false, message: error.message };
      }
    }

    revalidatePath("/admin/members");
    revalidatePath("/admin/users");
    return { success: true, message: "Member removed." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to remove member.",
    };
  }
}

export async function setMemberPassword(
  memberId: string,
  newPassword: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  if (newPassword.trim().length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", memberId)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: "Member not found." };
    }

    const { error } = await supabase.auth.admin.updateUserById(memberId, {
      password: newPassword.trim(),
    });
    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message:
        "Password updated. Previous passwords cannot be viewed or recovered.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to set password.",
    };
  }
}

export async function setCustomerPassword(
  customerId: string,
  newPassword: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  if (newPassword.trim().length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters.",
    };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", customerId)
      .maybeSingle();

    if (!profile || String(profile.role ?? "").toLowerCase() !== "customer") {
      return { success: false, message: "Customer not found." };
    }

    const { error } = await supabase.auth.admin.updateUserById(customerId, {
      password: newPassword.trim(),
    });
    if (error) return { success: false, message: error.message };

    return {
      success: true,
      message: "Password updated. Previous passwords cannot be viewed or recovered.",
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to set password.",
    };
  }
}
