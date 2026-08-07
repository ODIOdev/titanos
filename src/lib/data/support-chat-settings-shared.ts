import {
  DEFAULT_SUPPORT_SCHEDULE,
  formatSupportHoursLabel,
  type SupportDayKey,
  type SupportDayHours,
  type SupportSchedule,
} from "@/lib/support/hours";

export const SUPPORT_CHAT_SETTINGS_KEY = "support_chat";

export type SupportChatPresence = "auto" | "online" | "offline";

export type {
  SupportDayKey,
  SupportDayHours,
  SupportSchedule,
};

export type SupportChatSettings = {
  /** Show the floating chat launcher on the storefront. */
  widgetEnabled: boolean;
  /** Use AI-assisted replies instead of basic topic replies. */
  aiEnabled: boolean;
  /** Override the online/offline badge. */
  presence: SupportChatPresence;
  /** Weekly open hours used for auto presence + chat header. */
  schedule: SupportSchedule;
  /** Hours line shown under the chat header next to Online / Offline. */
  hoursLabel: string;
  /** First message visitors see when opening chat. */
  greeting: string;
};

export const DEFAULT_SUPPORT_CHAT_GREETING =
  "Hi! You're chatting with Titan support. Pick a topic or send us a message and we'll help you out.";

export const DEFAULT_SUPPORT_CHAT: SupportChatSettings = {
  widgetEnabled: true,
  aiEnabled: false,
  presence: "auto",
  schedule: DEFAULT_SUPPORT_SCHEDULE,
  hoursLabel: formatSupportHoursLabel(DEFAULT_SUPPORT_SCHEDULE),
  greeting: DEFAULT_SUPPORT_CHAT_GREETING,
};
