"use server";

import { revalidatePath } from "next/cache";
import { addressSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/actions/auth";

async function getClient() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

export async function saveShippingAddress(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  if (!isSupabaseConfigured()) {
    const body = (input ?? {}) as { id?: string | null };
    return {
      success: true,
      message: "Demo mode — address saved locally for this session only.",
      id: body.id ? String(body.id) : `demo-${Date.now()}`,
    };
  }

  const body = (input ?? {}) as Record<string, unknown>;
  const id = typeof body.id === "string" && body.id ? body.id : null;
  const parsed = addressSchema.safeParse({
    ...body,
    type: "shipping",
    isDefault: body.isDefault ?? true,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid address",
    };
  }

  try {
    const supabase = await getClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Sign in to save addresses." };
    }

    const row = {
      user_id: user.id,
      type: "shipping" as const,
      is_default: parsed.data.isDefault,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      company: parsed.data.company?.trim() || null,
      line1: parsed.data.line1,
      line2: parsed.data.line2?.trim() || null,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      postal_code: parsed.data.postalCode,
      country: parsed.data.country || "US",
      phone: parsed.data.phone?.trim() || null,
    };

    if (parsed.data.isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false } as never)
        .eq("user_id", user.id)
        .eq("type", "shipping");
    }

    if (id) {
      const { error } = await supabase
        .from("addresses")
        .update(row as never)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return { success: false, error: error.message };
      revalidatePath("/account/profile");
      revalidatePath("/account/addresses");
      revalidatePath("/checkout");
      return { success: true, message: "Shipping address updated.", id };
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert(row as never)
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };

    revalidatePath("/account/profile");
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return {
      success: true,
      message: "Shipping address saved.",
      id: (data as { id: string }).id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to save address.",
    };
  }
}

export async function setDefaultShippingAddress(
  addressId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Default shipping address updated." };
  }
  if (!addressId) {
    return { success: false, error: "Missing address id." };
  }

  try {
    const supabase = await getClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Sign in to update addresses." };
    }

    await supabase
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("user_id", user.id)
      .eq("type", "shipping");

    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true } as never)
      .eq("id", addressId)
      .eq("user_id", user.id)
      .eq("type", "shipping");

    if (error) return { success: false, error: error.message };

    revalidatePath("/account/profile");
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { success: true, message: "Default shipping address updated." };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Unable to set default address.",
    };
  }
}

export async function deleteShippingAddress(
  addressId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Address removed." };
  }
  if (!addressId) {
    return { success: false, error: "Missing address id." };
  }

  try {
    const supabase = await getClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Sign in to delete addresses." };
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/account/profile");
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { success: true, message: "Address deleted." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to delete address.",
    };
  }
}
