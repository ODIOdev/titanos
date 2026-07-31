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
import { absoluteUrl, isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let redirectTo = "/account";
    if (user) {
      if (isMasterAdminEmail(user.email)) {
        redirectTo = "/admin";
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_owner, email")
          .eq("id", user.id)
          .maybeSingle();
        if (isMasterAdmin(profile)) {
          redirectTo = "/admin";
        }
      }
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Signed in successfully.",
      redirectTo,
    };
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
  // Supports plain object (legacy) or FormData with optional "avatar" file
  const isFormData = typeof FormData !== "undefined" && input instanceof FormData;
  const raw = isFormData
    ? {
        firstName: String(input.get("firstName") ?? ""),
        lastName: String(input.get("lastName") ?? ""),
        email: String(input.get("email") ?? ""),
        company: String(input.get("company") ?? "") || undefined,
        phone: String(input.get("phone") ?? "") || undefined,
        state: String(input.get("state") ?? ""),
        postalCode: String(input.get("postalCode") ?? ""),
        password: String(input.get("password") ?? ""),
        confirmPassword: String(input.get("confirmPassword") ?? ""),
      }
    : input;

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const avatarFile =
    isFormData && input.get("avatar") instanceof File
      ? (input.get("avatar") as File)
      : null;

  try {
    const supabase = await getServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          company: parsed.data.company ?? null,
          phone: parsed.data.phone ?? null,
          state: parsed.data.state,
          postal_code: parsed.data.postalCode,
        },
        emailRedirectTo: absoluteUrl("/auth/callback"),
      },
    });
    if (error) return { success: false, error: error.message };

    if (avatarFile && avatarFile.size > 0 && data.user) {
      try {
        await persistAvatarFile(data.user.id, avatarFile, {
          // Prefer user session; use service role when email confirmation leaves no session
          preferService: !data.session,
        });
      } catch {
        // Account still created — photo can be added later from profile
      }
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      message: data.session
        ? "Account created."
        : "Account created. Check your email to confirm your address.",
      redirectTo: data.session ? "/account" : undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to create account.",
    };
  }
}

async function persistAvatarFile(
  userId: string,
  file: File,
  options?: { preferService?: boolean },
): Promise<string> {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  let publicUrl: string | null = null;

  try {
    const storageClient = options?.preferService
      ? (await import("@/lib/supabase/admin")).createServiceClient()
      : await getServerClient();

    const { error: uploadError } = await storageClient.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = storageClient.storage.from("avatars").getPublicUrl(path);
    publicUrl = data.publicUrl;

    const { error } = await storageClient
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", userId);

    if (error) throw error;
  } catch {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const nodePath = await import("node:path");
    const dir = nodePath.join(
      process.cwd(),
      "public",
      "uploads",
      "avatars",
      userId,
    );
    await mkdir(dir, { recursive: true });
    const filename = path.split("/").pop()!;
    await writeFile(nodePath.join(dir, filename), buffer);
    publicUrl = `/uploads/avatars/${userId}/${filename}`;

    try {
      const db = options?.preferService
        ? (await import("@/lib/supabase/admin")).createServiceClient()
        : await getServerClient();
      await db
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", userId);
    } catch {
      // Profile row may not exist yet; URL still usable once synced
    }
  }

  return publicUrl!;
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

export async function uploadAvatar(
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to upload a photo." };
    }

    const publicUrl = await persistAvatarFile(user.id, file);

    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");
    return { success: true, message: "Profile photo updated.", url: publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to upload photo.",
    };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");
    return { success: true, message: "Profile photo removed." };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to remove photo.",
    };
  }
}
