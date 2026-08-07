"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { affiliateApplicationSchema } from "@/lib/validations";

export type AffiliateApplicationResult = {
  success: boolean;
  message: string;
};

export async function submitAffiliateApplication(
  input: unknown,
): Promise<AffiliateApplicationResult> {
  const parsed = affiliateApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.errors[0]?.message ??
        "Please check the form and try again.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Applications are unavailable in demo mode.",
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
        message: "Sign in to apply for the affiliate program.",
      };
    }

    const { data: existing } = await supabase
      .from("affiliate_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "pending") {
      return {
        success: false,
        message: "Your application is already under review.",
      };
    }
    if (existing?.status === "approved") {
      return {
        success: false,
        message: "You're already an approved affiliate.",
      };
    }

    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "cancelled");

    const row = {
      user_id: user.id,
      status: "pending",
      contact_name: data.contactName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      audience: data.audience.trim(),
      motivation: data.motivation?.trim() || null,
      agreed_to_terms: true,
      orders_at_apply: count ?? 0,
      // Clear the previous decision when a declined applicant re-applies.
      admin_note: null,
      reviewed_by: null,
      reviewed_at: null,
    };

    const { error } = existing
      ? await supabase
          .from("affiliate_applications")
          .update(row)
          .eq("id", existing.id)
      : await supabase.from("affiliate_applications").insert(row);

    if (error) throw error;

    revalidatePath("/affiliates");
    revalidatePath("/admin/affiliates");
    revalidatePath("/admin/users");

    return {
      success: true,
      message:
        "Application received. We'll review it and email you when a decision is made.",
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Unable to submit your application right now.",
    };
  }
}
