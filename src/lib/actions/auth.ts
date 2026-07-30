"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { absoluteUrl } from "@/lib/utils";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

async function getServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Authentication is not configured. Add Supabase environment variables to enable sign-in.",
    );
  }
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

export async function login(
  input: unknown,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/", "layout");
    return { success: true, message: "Signed in successfully." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to sign in.",
    };
  }
}

export async function register(
  input: unknown,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          company: parsed.data.company ?? null,
          phone: parsed.data.phone ?? null,
        },
        emailRedirectTo: absoluteUrl("/auth/callback"),
      },
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Account created. Check your email to confirm your address.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to create account.",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await getServerClient();
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore logout failures when auth is unavailable
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(
  input: unknown,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  try {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: absoluteUrl("/auth/callback?next=/account/profile"),
    });
    if (error) return { success: false, error: error.message };
    return {
      success: true,
      message: "If an account exists for that email, a reset link is on its way.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to send reset email.",
    };
  }
}

export async function updateProfile(
  input: unknown,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to update your profile." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        company: parsed.data.company ?? null,
        phone: parsed.data.phone ?? null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    await supabase.auth.updateUser({
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        company: parsed.data.company ?? null,
        phone: parsed.data.phone ?? null,
      },
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");
    return { success: true, message: "Profile updated." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to update profile.",
    };
  }
}
