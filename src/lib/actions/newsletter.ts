"use server";

import { newsletterSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type NewsletterResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function subscribeNewsletter(
  input: unknown,
): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Enter a valid email",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: "Thanks for subscribing! (Demo mode — email recorded locally.)",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email: parsed.data.email.toLowerCase(), active: true } as never,
      { onConflict: "email" },
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "You're subscribed. Watch your inbox for safety updates.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to subscribe right now.",
    };
  }
}
