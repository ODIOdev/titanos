import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

/** Deduped per-request auth check for layout chrome (header/footer). */
export const getIsSignedIn = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
});

/** Lets admins keep browsing the storefront while maintenance mode is on. */
export const getIsMasterAdmin = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    if (isMasterAdminEmail(user.email)) return true;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    return isMasterAdmin(profile);
  } catch {
    return false;
  }
});

export type CheckoutProfileDefaults = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

/** Profile + default shipping address for checkout autofill. */
export const getCheckoutProfileDefaults = cache(
  async (): Promise<CheckoutProfileDefaults> => {
    const empty: CheckoutProfileDefaults = {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
    };

    if (!isSupabaseConfigured()) {
      return {
        ...empty,
        email: "demo@titansafetyco.com",
        firstName: "Demo",
        lastName: "Customer",
        company: "Demo Construction LLC",
      };
    }

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return empty;

      const [{ data: profile }, { data: address }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const row = profile as {
        email?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        company?: string | null;
        phone?: string | null;
      } | null;

      const addr = address as {
        first_name?: string | null;
        last_name?: string | null;
        company?: string | null;
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        phone?: string | null;
      } | null;

      return {
        email: row?.email ?? user.email ?? "",
        firstName:
          addr?.first_name ||
          row?.first_name ||
          (user.user_metadata?.first_name as string | undefined) ||
          "",
        lastName:
          addr?.last_name ||
          row?.last_name ||
          (user.user_metadata?.last_name as string | undefined) ||
          "",
        company:
          addr?.company ||
          row?.company ||
          (user.user_metadata?.company as string | undefined) ||
          "",
        phone:
          addr?.phone ||
          row?.phone ||
          (user.user_metadata?.phone as string | undefined) ||
          "",
        line1: addr?.line1 ?? "",
        line2: addr?.line2 ?? "",
        city: addr?.city ?? "",
        state: (addr?.state ?? "").toUpperCase(),
        postalCode: addr?.postal_code ?? "",
      };
    } catch {
      return empty;
    }
  },
);
