"use client";

import { useState, type ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import type { SupportChatSettings } from "@/lib/data/support-chat-settings-shared";

const SAFE_BOTTOM =
  "calc(0.75rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))";

/**
 * Tiny stub launcher — loads the full support chat chunk only on first click
 * so most page views never pay for chat JS or timers.
 */
export function SupportChatLazy({
  settings,
}: {
  settings: SupportChatSettings;
}) {
  const [Chat, setChat] = useState<ComponentType<{
    initialOpen?: boolean;
    settings?: SupportChatSettings;
  }> | null>(null);
  const [loading, setLoading] = useState(false);

  if (!settings.widgetEnabled) return null;

  if (Chat) {
    return <Chat initialOpen settings={settings} />;
  }

  return (
    <button
      type="button"
      aria-label="Open support chat"
      aria-busy={loading || undefined}
      disabled={loading}
      className="support-chat-launcher fixed z-50 inline-flex size-12 items-center justify-center rounded-full bg-titan-yellow text-dark-charcoal shadow-[0_8px_24px_rgba(16,24,32,0.28),0_0_0_3px_rgba(245,196,0,0.35)] transition-[background-color,box-shadow] hover:bg-[#e0b400] hover:shadow-[0_10px_28px_rgba(16,24,32,0.32),0_0_0_4px_rgba(245,196,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-charcoal focus-visible:ring-offset-2 disabled:opacity-80 @3xl:size-14"
      style={{ bottom: SAFE_BOTTOM }}
      onClick={() => {
        if (loading) return;
        setLoading(true);
        void import("@/components/support/support-chat")
          .then((mod) => {
            setChat(() => mod.SupportChat);
          })
          .catch(() => {
            setLoading(false);
          });
      }}
    >
      <MessageCircle className="size-5 @3xl:size-6" aria-hidden="true" />
    </button>
  );
}
