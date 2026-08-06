"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { productReviewSchema } from "@/lib/validations";

export type SubmitProductReviewResult = {
  success: boolean;
  message: string;
  ratingAvg?: number;
  ratingCount?: number;
};

async function recomputeProductRating(
  productId: string,
  admin: ReturnType<typeof import("@/lib/supabase/admin").createServiceClient>,
) {
  const { data: rows, error } = await admin
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("approved", true);

  if (error) throw error;

  const count = rows?.length ?? 0;
  const avg =
    count > 0
      ? Math.round(
          ((rows!.reduce((sum, row) => sum + row.rating, 0) / count) +
            Number.EPSILON) *
            100,
        ) / 100
      : 0;

  const { error: updateError } = await admin
    .from("products")
    .update({ rating_avg: avg, rating_count: count })
    .eq("id", productId);

  if (updateError) throw updateError;

  return { ratingAvg: avg, ratingCount: count };
}

export async function submitProductReview(
  input: unknown,
): Promise<SubmitProductReviewResult> {
  const parsed = productReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.errors[0]?.message ??
        "Please choose a star rating and try again.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Ratings are unavailable in demo mode.",
    };
  }

  const data = parsed.data;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Sign in to rate this product.",
      };
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, slug, active")
      .eq("id", data.productId)
      .maybeSingle();

    if (productError) throw productError;
    if (!product?.active || product.slug !== data.productSlug) {
      return { success: false, message: "Product not found." };
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .neq("status", "cancelled");

    const orderIds = (orders ?? []).map((order) => order.id);
    let verifiedPurchase = false;
    if (orderIds.length > 0) {
      const { count: purchaseCount } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", data.productId)
        .in("order_id", orderIds);
      verifiedPurchase = (purchaseCount ?? 0) > 0;
    }

    const title = data.title?.trim() || null;
    const body = data.body?.trim() || null;

    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();

    const { data: existing } = await admin
      .from("reviews")
      .select("id")
      .eq("product_id", data.productId)
      .eq("user_id", user.id)
      .maybeSingle();

    const row = {
      product_id: data.productId,
      user_id: user.id,
      rating: data.rating,
      title,
      body,
      verified_purchase: verifiedPurchase,
      approved: true,
    };

    const { error: writeError } = existing
      ? await admin.from("reviews").update(row).eq("id", existing.id)
      : await admin.from("reviews").insert(row);

    if (writeError) throw writeError;

    const aggregates = await recomputeProductRating(data.productId, admin);

    revalidatePath(`/product/${data.productSlug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return {
      success: true,
      message: existing
        ? "Your rating was updated."
        : "Thanks — your rating was saved.",
      ratingAvg: aggregates.ratingAvg,
      ratingCount: aggregates.ratingCount,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Unable to save your rating right now.",
    };
  }
}
