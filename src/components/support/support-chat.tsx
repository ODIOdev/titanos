"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Headphones, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_SHIPPING_THRESHOLD, SITE_CONFIG } from "@/lib/data/seed-data";
import type { SupportChatSettings } from "@/lib/data/support-chat-settings-shared";
import { DEFAULT_SUPPORT_CHAT } from "@/lib/data/support-chat-settings-shared";
import { isSupportOpen } from "@/lib/support/hours";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "titan-support-chat";

type ChatLink = { label: string; href: string };

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  links?: ChatLink[];
};

const TOPICS: { label: string; reply: string; links?: ChatLink[] }[] = [
  {
    label: "Order status",
    reply:
      "You can track every order from your account. If you checked out as a guest, send us your order number and we'll look it up.",
    links: [
      { label: "My orders", href: "/account/orders" },
      { label: "Shipping info", href: "/shipping" },
    ],
  },
  {
    label: "Sizing & specs",
    reply:
      "Each product page lists ANSI class, sizes, colors, and certifications. Tell us the job requirement and we'll match the right gear.",
    links: [{ label: "Browse catalog", href: "/shop" }],
  },
  {
    label: "Bulk pricing",
    reply:
      "We quote crews, municipalities, and multi-site accounts within one business day. Share your product list and quantities to get started.",
    links: [
      { label: "Request a quote", href: "/quote" },
      { label: "Bulk orders", href: "/bulk-orders" },
    ],
  },
  {
    label: "Returns",
    reply: `Unused gear can be returned within 30 days, and shipping is free on orders over $${FREE_SHIPPING_THRESHOLD}.`,
    links: [{ label: "Return policy", href: "/returns" }],
  },
];

function resolveOnline(
  presence: SupportChatSettings["presence"],
  scheduleOpen: boolean,
) {
  if (presence === "online") return true;
  if (presence === "offline") return false;
  return scheduleOpen;
}

function greetingMessage(text: string): ChatMessage {
  return { id: "greeting", role: "agent", text };
}

function readStoredThread(fallback: string): ChatMessage[] {
  if (typeof window === "undefined") return [greetingMessage(fallback)];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) && parsed.length
      ? (parsed as ChatMessage[])
      : [greetingMessage(fallback)];
  } catch {
    return [greetingMessage(fallback)];
  }
}

export function SupportChat({
  initialOpen = false,
  settings = DEFAULT_SUPPORT_CHAT,
}: {
  initialOpen?: boolean;
  settings?: SupportChatSettings;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([
    greetingMessage(settings.greeting),
  ]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(() =>
    resolveOnline(settings.presence, false),
  );
  const [hydrated, setHydrated] = useState(false);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (!open || hydrated) return;
    setMessages(readStoredThread(settings.greeting));
    setOnline(
      resolveOnline(settings.presence, isSupportOpen(new Date(), settings.schedule)),
    );
    setHydrated(true);
  }, [open, hydrated, settings.greeting, settings.presence, settings.schedule]);

  useEffect(() => {
    if (!hydrated) return;
    if (settings.presence !== "auto") {
      setOnline(settings.presence === "online");
      return;
    }
    const sync = () =>
      setOnline(
        resolveOnline(
          settings.presence,
          isSupportOpen(new Date(), settings.schedule),
        ),
      );
    sync();
    const interval = window.setInterval(sync, 60_000);
    return () => window.clearInterval(interval);
  }, [hydrated, settings.presence, settings.schedule]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable (private mode) — the chat still works in memory.
    }
  }, [messages, hydrated]);

  useEffect(() => {
    if (!open) return;
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [open, messages, sending]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  function exchange(userText: string, reply: Omit<ChatMessage, "id" | "role">) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${prev.length}`, role: "user", text: userText },
      { id: `a-${prev.length + 1}`, role: "agent", ...reply },
    ]);
  }

  function pickTopic(topic: (typeof TOPICS)[number]) {
    const text = settings.aiEnabled
      ? `Here's a quick answer: ${topic.reply}`
      : topic.reply;
    exchange(topic.label, { text, links: topic.links });
    inputRef.current?.focus();
  }

  function fallbackAiReply(): Omit<ChatMessage, "id" | "role"> {
    return {
      text: online
        ? `Sorry — I couldn't reach AI support just now. Browse the catalog or quote form, or call ${SITE_CONFIG.phoneDisplay}.`
        : `Sorry — I couldn't reach AI support just now (${settings.hoursLabel}). Email ${SITE_CONFIG.supportEmail} and the team will follow up.`,
      links: [
        { label: "Browse catalog", href: "/shop" },
        { label: "Request a quote", href: "/quote" },
        {
          label: "Email support",
          href: `mailto:${SITE_CONFIG.supportEmail}`,
        },
      ],
    };
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    if (!settings.aiEnabled) {
      exchange(text, {
        text: online
          ? `Thanks — a specialist is picking this up now. If you'd rather talk it through, call ${SITE_CONFIG.phoneDisplay}.`
          : `Thanks! We're offline right now (${settings.hoursLabel}). Send this to ${SITE_CONFIG.supportEmail} and we'll reply first thing.`,
        links: [
          {
            label: "Email support",
            href: `mailto:${SITE_CONFIG.supportEmail}`,
          },
          { label: "Request a quote", href: "/quote" },
        ],
      });
      return;
    }

    const prior = messagesRef.current;
    const userMessage: ChatMessage = {
      id: `u-${prior.length}`,
      role: "user",
      text,
    };
    const thread = [...prior, userMessage];
    setMessages(thread);
    setSending(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: thread.slice(-12).map(({ role, text: messageText }) => ({
            role,
            text:
              messageText.length > 1500
                ? `${messageText.slice(0, 1499)}…`
                : messageText,
          })),
          online,
          hoursLabel: settings.hoursLabel,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        text?: string;
        links?: ChatLink[];
      } | null;

      if (!res.ok || !data?.text) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${prev.length}`, role: "agent", ...fallbackAiReply() },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${prev.length}`,
          role: "agent",
          text: data.text!,
          links: data.links,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${prev.length}`, role: "agent", ...fallbackAiReply() },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const safeBottom =
    "calc(0.75rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))";
  const panelBottom =
    "calc(4.25rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))";

  const title = settings.aiEnabled
    ? `${SITE_CONFIG.shortName} AI Support`
    : `${SITE_CONFIG.shortName} Support`;
  const TitleIcon = settings.aiEnabled ? Bot : Headphones;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="support-chat-launcher fixed z-50 inline-flex size-12 items-center justify-center rounded-full bg-titan-yellow text-dark-charcoal shadow-[0_8px_24px_rgba(16,24,32,0.28),0_0_0_3px_rgba(245,196,0,0.35)] transition-[background-color,box-shadow] hover:bg-[#e0b400] hover:shadow-[0_10px_28px_rgba(16,24,32,0.32),0_0_0_4px_rgba(245,196,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-charcoal focus-visible:ring-offset-2 @3xl:size-14"
        style={{ bottom: safeBottom }}
      >
        {open ? (
          <X className="size-5 @3xl:size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-5 @3xl:size-6" aria-hidden="true" />
        )}
        {!open && online ? (
          <span
            className="absolute top-1 right-1 size-3 rounded-full border-2 border-white bg-success-green"
            aria-hidden="true"
          />
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Customer service chat"
          className="support-chat-panel fixed z-40 flex max-h-[min(28rem,calc(100%-6.75rem))] w-auto flex-col overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_24px_60px_rgba(16,24,32,0.28)] @3xl:w-[22rem] @3xl:max-h-[min(32rem,calc(100%-8rem))]"
          style={{ bottom: panelBottom }}
        >
          <header className="flex items-start gap-3 border-b border-white/10 bg-dark-charcoal px-4 py-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-titan-yellow text-dark-charcoal">
              <TitleIcon className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
                {title}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    online ? "bg-success-green" : "bg-medium-gray",
                  )}
                  aria-hidden="true"
                />
                <span>
                  {online ? "Online now" : "Offline"} · {settings.hoursLabel}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div
            ref={threadRef}
            className="flex-1 space-y-3 overflow-y-auto bg-light-gray px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "min-w-0 max-w-[85%] rounded-sm px-3 py-2 text-sm",
                  message.role === "agent"
                    ? "border border-border-gray bg-white text-dark-charcoal"
                    : "ml-auto bg-dark-charcoal text-white",
                )}
              >
                <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {message.text}
                </p>
                {message.links?.length ? (
                  <ul className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                    {message.links.map((link) => (
                      <li key={link.href} className="min-w-0 max-w-full">
                        {link.href.startsWith("mailto:") ? (
                          <a
                            href={link.href}
                            className="inline-flex max-w-full truncate rounded-sm border border-border-gray bg-light-gray px-2 py-0.5 text-xs font-medium text-dark-charcoal hover:border-dark-charcoal"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="inline-flex max-w-full truncate rounded-sm border border-border-gray bg-light-gray px-2 py-0.5 text-xs font-medium text-dark-charcoal hover:border-dark-charcoal"
                            onClick={() => setOpen(false)}
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {sending ? (
              <div
                className="max-w-[85%] rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-medium-gray"
                aria-live="polite"
              >
                Typing…
              </div>
            ) : null}
          </div>

          {messages.length <= 1 && !sending ? (
            <div className="flex flex-wrap gap-1.5 border-t border-border-gray bg-white px-3 py-2.5">
              {TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => pickTopic(topic)}
                  className="rounded-sm border border-border-gray bg-light-gray px-2.5 py-1 text-xs font-medium text-dark-charcoal hover:border-dark-charcoal"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex gap-2 border-t border-border-gray bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label htmlFor="support-chat-input" className="sr-only">
              Message
            </label>
            <input
              ref={inputRef}
              id="support-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message…"
              disabled={sending}
              className="h-10 min-w-0 flex-1 rounded-sm border border-border-gray bg-white px-3 text-sm text-dark-charcoal placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:opacity-60"
            />
            <Button
              type="submit"
              size="md"
              aria-label="Send message"
              disabled={sending || !input.trim()}
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </section>
      ) : null}
    </>
  );
}
