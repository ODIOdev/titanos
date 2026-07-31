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
