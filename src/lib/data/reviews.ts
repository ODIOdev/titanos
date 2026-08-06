import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProductReview } from "@/types";

function displayName(fullName: string | null | undefined, email?: string | null) {
  const name = fullName?.trim();
  if (name) return name;
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "Customer";
}

export async function getApprovedReviews(
  productId: string,
): Promise<ProductReview[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, user_id, rating, title, body, verified_purchase, approved, created_at")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error) throw error;
    if (!data?.length) return [];

    const userIds = [...new Set(data.map((row) => row.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const nameById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.full_name]),
    );

    return data.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      user_id: row.user_id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      verified_purchase: row.verified_purchase,
      approved: row.approved,
      created_at: row.created_at,
      author_name: displayName(nameById.get(row.user_id)),
    }));
  } catch {
    return [];
  }
}

export async function getMyProductReview(
  productId: string,
): Promise<ProductReview | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, user_id, rating, title, body, verified_purchase, approved, created_at")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: data.id,
      product_id: data.product_id,
      user_id: data.user_id,
      rating: data.rating,
      title: data.title,
      body: data.body,
      verified_purchase: data.verified_purchase,
      approved: data.approved,
      created_at: data.created_at,
      author_name: displayName(profile?.full_name, user.email),
    };
  } catch {
    return null;
  }
}
