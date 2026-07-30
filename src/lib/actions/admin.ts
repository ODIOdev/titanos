"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CategoryFormInput, ProductFormInput } from "@/lib/validations";
import { categoryFormSchema, productFormSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { generateOrderNumber, slugify } from "@/lib/utils";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return {
        ok: false,
        result: { success: false, message: "Admin access required." },
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

function mapProductPayload(input: ProductFormInput) {
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
    inventory_quantity: input.inventoryQuantity,
    low_stock_threshold: input.lowStockThreshold ?? 10,
    weight: input.weight ?? null,
    shipping_class: input.shippingClass || null,
    active: input.active ?? true,
    featured: input.featured ?? false,
    bestseller: input.bestseller ?? false,
    product_type: input.productType || null,
    ansi_class: input.ansiClass || null,
    color: input.color || null,
    size: input.size || null,
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
      active: parsed.data.active ?? true,
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

export async function createProduct(raw: ProductFormInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .insert(mapProductPayload(parsed.data))
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/products");
    revalidatePath("/products");
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
    const { error } = await supabase
      .from("products")
      .update(mapProductPayload(parsed.data))
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/products");
    return { success: true, message: "Product updated.", id };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update product.",
    };
  }
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("products")
      .update({ active: false })
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

export async function restoreProduct(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.result;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("products")
      .update({ active: true })
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

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        ...(notes != null ? { internal_notes: notes } : {}),
      })
      .eq("id", orderId);

    if (error) throw error;

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status,
      notes: notes ?? null,
      created_by: auth.userId,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
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
    const freeShippingThreshold = Number(formData.get("freeShippingThreshold") ?? 199);

    const rows = [
      {
        key: "site_config",
        value: { name: siteName, tagline, supportEmail, phone },
      },
      {
        key: "free_shipping_threshold",
        value: { amount: freeShippingThreshold, currency: "usd" },
      },
    ];

    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;

    revalidatePath("/admin/settings");
    return { success: true, message: "Settings saved." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save settings.",
    };
  }
}
