import { cache } from "react";
import { FREE_SHIPPING_THRESHOLD as DEFAULT_FREE_SHIPPING_THRESHOLD } from "@/lib/data/seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const FREE_SHIPPING_THRESHOLD_KEY = "free_shipping_threshold";

/**
 * Live free-shipping threshold from admin Site Settings.
 * Falls back to the seed default when unset or offline.
 */
export const getFreeShippingThreshold = cache(
  async (): Promise<number> => {
    if (!isSupabaseConfigured()) return DEFAULT_FREE_SHIPPING_THRESHOLD;

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", FREE_SHIPPING_THRESHOLD_KEY)
        .maybeSingle();

      const value = data?.value as { amount?: unknown } | null;
      const amount = Number(value?.amount);
      if (Number.isFinite(amount) && amount >= 0) return amount;
    } catch {
      // Fall through
    }

    return DEFAULT_FREE_SHIPPING_THRESHOLD;
  },
);
