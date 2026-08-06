"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Headphones, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_SHIPPING_THRESHOLD, SITE_CONFIG } from "@/lib/data/seed-data";
import { SUPPORT_HOURS_LABEL, isSupportOpen } from "@/lib/support/hours";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "titan-support-chat";

type ChatLink = { label: string; href: string };

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  links?: ChatLink[];
};

const GREETING: ChatMessage = {
  id: "greeting",
  role: "agent",
  text: `Hi! You're chatting with ${SITE_CONFIG.shortName} support. Pick a topic or send us a message and we'll help you out.`,
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

/** Safe during render: the thread only renders once the panel is opened. */
function readStoredThread(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) && parsed.length
      ? (parsed as ChatMessage[])
      : [GREETING];
  } catch {
    return [GREETING];
  }
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  // Restored from sessionStorage so the conversation survives a refresh.
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredThread);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sampled off the clock and refreshed each minute so the badge flips when
  // support opens or closes while the page stays put.
  useEffect(() => {
    const sync = () => setOnline(isSupportOpen());
    const first = window.setTimeout(sync, 0);
    const interval = window.setInterval(sync, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable (private mode) — the chat still works in memory.
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [open, messages]);

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

  /** Ids come from the thread length so they stay stable across re-renders. */
  function exchange(userText: string, reply: Omit<ChatMessage, "id" | "role">) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${prev.length}`, role: "user", text: userText },
      { id: `a-${prev.length + 1}`, role: "agent", ...reply },
    ]);
  }

  function pickTopic(topic: (typeof TOPICS)[number]) {
    exchange(topic.label, { text: topic.reply, links: topic.links });
    inputRef.current?.focus();
  }

  function send() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    exchange(text, {
      text: online
        ? `Thanks — a specialist is picking this up now. If you'd rather talk it through, call ${SITE_CONFIG.phoneDisplay}.`
        : `Thanks! We're offline right now (${SUPPORT_HOURS_LABEL}). Send this to ${SITE_CONFIG.supportEmail} and we'll reply first thing.`,
      links: [
        { label: "Email support", href: `mailto:${SITE_CONFIG.supportEmail}` },
        { label: "Request a quote", href: "/quote" },
      ],
    });
  }

  const safeBottom =
    "calc(0.75rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))";
  const panelBottom =
    "calc(4.25rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="support-chat-launcher fixed right-3 z-40 inline-flex size-12 items-center justify-center rounded-full bg-titan-yellow text-dark-charcoal shadow-[0_10px_30px_rgba(16,24,32,0.28)] transition-colors hover:bg-titan-yellow/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-charcoal focus-visible:ring-offset-2 @3xl:right-6 @3xl:size-14"
        style={{ bottom: safeBottom }}
      >
        {open ? (
          <X className="size-5 @3xl:size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-5 @3xl:size-6" aria-hidden="true" />
        )}
        {!open && online ? (
          <span
            className="absolute right-1 top-1 size-3 rounded-full border-2 border-titan-yellow bg-success-green"
            aria-hidden="true"
          />
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Customer service chat"
          className="support-chat-panel fixed left-3 right-3 z-40 flex max-h-[min(28rem,calc(100%-6.75rem))] w-auto flex-col overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_24px_60px_rgba(16,24,32,0.28)] @3xl:left-auto @3xl:right-6 @3xl:w-[22rem] @3xl:max-h-[min(32rem,calc(100%-8rem))]"
          style={{ bottom: panelBottom }}
        >
          <header className="flex items-start gap-3 border-b border-white/10 bg-dark-charcoal px-4 py-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-titan-yellow text-dark-charcoal">
              <Headphones className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
                {SITE_CONFIG.shortName} Support
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    online ? "bg-success-green" : "bg-medium-gray",
                  )}
                  aria-hidden="true"
                />
                {online ? "Online now" : "Offline"} · {SUPPORT_HOURS_LABEL}
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
                  "max-w-[85%] rounded-sm px-3 py-2 text-sm",
                  message.role === "agent"
                    ? "border border-border-gray bg-white text-dark-charcoal"
                    : "ml-auto bg-dark-charcoal text-white",
                )}
              >
                <p>{message.text}</p>
                {message.links?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {message.links.map((link) => (
                      <li key={link.href}>
                        {link.href.startsWith("mailto:") ? (
                          <a
                            href={link.href}
                            className="inline-flex rounded-sm border border-border-gray bg-light-gray px-2 py-1 text-xs font-medium text-dark-charcoal transition-colors hover:border-dark-charcoal"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="inline-flex rounded-sm border border-border-gray bg-light-gray px-2 py-1 text-xs font-medium text-dark-charcoal transition-colors hover:border-dark-charcoal"
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
          </div>

          <div className="border-t border-border-gray bg-white px-4 py-3">
            <ul className="flex flex-wrap gap-1.5">
              {TOPICS.map((topic) => (
                <li key={topic.label}>
                  <button
                    type="button"
                    onClick={() => pickTopic(topic)}
                    className="rounded-full border border-border-gray px-2.5 py-1 text-xs font-medium text-dark-charcoal transition-colors hover:border-dark-charcoal"
                  >
                    {topic.label}
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <label htmlFor="support-chat-input" className="sr-only">
                Message customer service
              </label>
              <input
                id="support-chat-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question…"
                autoComplete="off"
                className="h-10 w-full rounded-sm border border-border-gray bg-white px-3 text-sm text-near-black placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-10 shrink-0 px-3"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </form>

            <p className="mt-2 text-[11px] text-medium-gray">
              Prefer the phone?{" "}
              <a
                href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
                className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
              >
                {SITE_CONFIG.phoneDisplay}
              </a>
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
