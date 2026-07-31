import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const MAINTENANCE_SETTINGS_KEY = "maintenance_mode";

export type MaintenanceSettings = {
  enabled: boolean;
  headline: string;
  message: string;
  /** ISO timestamp of the last time the site was taken offline. */
  startedAt: string | null;
};

export const DEFAULT_MAINTENANCE_HEADLINE = "We’ll be right back";

export const DEFAULT_MAINTENANCE_MESSAGE =
  "Our online store is temporarily offline for maintenance. Phone and email orders are still going out — reach us and we’ll take care of you.";

export const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  headline: DEFAULT_MAINTENANCE_HEADLINE,
  message: DEFAULT_MAINTENANCE_MESSAGE,
  startedAt: null,
};

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Read once per request: the storefront layout checks this on every render.
 */
export const getMaintenanceSettings = cache(
  async (): Promise<MaintenanceSettings> => {
    if (!isSupabaseConfigured()) return DEFAULT_MAINTENANCE;

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", MAINTENANCE_SETTINGS_KEY)
        .maybeSingle();

      const value = data?.value as {
        enabled?: unknown;
        headline?: unknown;
        message?: unknown;
        startedAt?: unknown;
      } | null;
      if (!value) return DEFAULT_MAINTENANCE;

      return {
        enabled: value.enabled === true,
        headline: readText(value.headline, DEFAULT_MAINTENANCE_HEADLINE),
        message: readText(value.message, DEFAULT_MAINTENANCE_MESSAGE),
        startedAt:
          typeof value.startedAt === "string" ? value.startedAt : null,
      };
    } catch {
      // A failed lookup must never take the storefront down.
      return DEFAULT_MAINTENANCE;
    }
  },
);
