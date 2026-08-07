import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  formatSupportHoursLabel,
  normalizeSupportSchedule,
} from "@/lib/support/hours";
import {
  DEFAULT_SUPPORT_CHAT,
  DEFAULT_SUPPORT_CHAT_GREETING,
  SUPPORT_CHAT_SETTINGS_KEY,
  type SupportChatPresence,
  type SupportChatSettings,
} from "@/lib/data/support-chat-settings-shared";

export {
  DEFAULT_SUPPORT_CHAT,
  DEFAULT_SUPPORT_CHAT_GREETING,
  SUPPORT_CHAT_SETTINGS_KEY,
  type SupportChatPresence,
  type SupportChatSettings,
} from "@/lib/data/support-chat-settings-shared";

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readPresence(value: unknown): SupportChatPresence {
  if (value === "online" || value === "offline" || value === "auto") return value;
  return "auto";
}

export const getSupportChatSettings = cache(
  async (): Promise<SupportChatSettings> => {
    if (!isSupabaseConfigured()) return DEFAULT_SUPPORT_CHAT;

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SUPPORT_CHAT_SETTINGS_KEY)
        .maybeSingle();

      const value = data?.value as Partial<SupportChatSettings> | null;
      if (!value) return DEFAULT_SUPPORT_CHAT;

      const schedule = normalizeSupportSchedule(value.schedule);
      return {
        widgetEnabled: value.widgetEnabled !== false,
        aiEnabled: value.aiEnabled === true,
        presence: readPresence(value.presence),
        schedule,
        hoursLabel: formatSupportHoursLabel(schedule),
        greeting: readText(value.greeting, DEFAULT_SUPPORT_CHAT_GREETING),
      };
    } catch {
      return DEFAULT_SUPPORT_CHAT;
    }
  },
);
