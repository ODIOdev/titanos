"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const SHELL_SRC = "/dev/iphone-shell.png";
const STORAGE_KEY = "titan.dev.iphoneShell";
const OPEN_EVENT = "titan:iphone-shell-open";

/** Measured screen hole inside public/dev/iphone-shell.png */
const SCREEN = {
  left: "7.1%",
  top: "1.95%",
  width: "86%",
  height: "95.2%",
} as const;

export function designShellAllowed() {
  // Never on Vercel. Local `next dev` only.
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) return false;
  if (process.env.VERCEL) return false;
  return process.env.NODE_ENV === "development";
}

/** Open the local iPhone simulator from admin / storefront nav. */
export function openDevIphonePreview() {
  if (typeof window === "undefined" || !designShellAllowed()) return;
  window.sessionStorage.setItem(STORAGE_KEY, "1");
  const url = new URL(window.location.href);
  url.searchParams.set("shell", "1");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Compact launcher for storefront utility bar / admin nav. Dev-only. */
export function DevIphonePreviewNavButton({
  className,
}: {
  className?: string;
}) {
  if (!designShellAllowed()) return null;

  return (
    <button
      type="button"
      onClick={openDevIphonePreview}
      className={className}
      title="Open local iPhone UI simulator (design only)"
    >
      iPhone preview
    </button>
  );
}

function formatIphoneTime(date: Date) {
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s?(AM|PM)$/i, "");
}

function StatusTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return <>{formatIphoneTime(now)}</>;
}

function CellularBars({ color }: { color: string }) {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <rect x="1" y="8" width="2.4" height="3.2" rx="0.6" fill={color} />
      <rect x="5.2" y="5.8" width="2.4" height="5.4" rx="0.6" fill={color} />
      <rect x="9.4" y="3.4" width="2.4" height="7.8" rx="0.6" fill={color} />
      <rect
        x="13.6"
        y="1"
        width="2.4"
        height="10.2"
        rx="0.6"
        fill={color}
        opacity="0.35"
      />
    </svg>
  );
}

function WifiIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path
        d="M8 9.7a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z"
        fill={color}
      />
      <path
        d="M4.35 7.55a5.2 5.2 0 0 1 7.3 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.1 5.15a8.35 8.35 0 0 1 11.8 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M0.55 2.85a11.2 11.2 0 0 1 14.9 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function BatteryIcon({ color, level }: { color: string; level: number }) {
  const fillWidth = Math.max(2, Math.round(18 * Math.min(1, Math.max(0, level))));
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden="true">
      <rect
        x="0.75"
        y="1.25"
        width="22.5"
        height="10.5"
        rx="2.4"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.45"
      />
      <rect
        x="2.35"
        y="2.85"
        width={fillWidth}
        height="7.3"
        rx="1.4"
        fill={color}
      />
      <path
        d="M24.4 4.4c.85.35 1.35.95 1.35 2.1s-.5 1.75-1.35 2.1V4.4Z"
        fill={color}
        opacity="0.45"
      />
    </svg>
  );
}

function useIphoneShellEnabled() {
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncFromUrlOrStorage() {
      const fromQuery = searchParams.get("shell");
      if (fromQuery === "1" || fromQuery === "true") {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
        setEnabled(true);
        return;
      }
      if (fromQuery === "0" || fromQuery === "false") {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setEnabled(false);
        return;
      }
      setEnabled(window.sessionStorage.getItem(STORAGE_KEY) === "1");
    }

    syncFromUrlOrStorage();

    function onOpen() {
      setEnabled(true);
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [searchParams]);

  const turnOff = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setEnabled(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("shell");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  return { enabled, turnOff };
}

/**
 * Wraps the live app in the iPhone frame (no iframe) so elements stay
 * selectable in Cursor / DevTools while reviewing mobile fitment.
 */
function DevIphoneShellRootInner({ children }: { children: ReactNode }) {
  const { enabled, turnOff } = useIphoneShellEnabled();
  const [shellOk, setShellOk] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("phone-sim");
    root.style.setProperty("--phone-safe-top", "2.1rem");
    root.style.setProperty("--phone-safe-bottom", "1.15rem");
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = root.style.overflow;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Let in-phone overlays (mobile nav, support chat) handle Escape first.
      if (
        document.querySelector(
          '.storefront-mobile-nav, [aria-label="Mobile navigation"], .support-chat-panel, [aria-label="Customer service chat"], .admin-mobile-drawer',
        )
      ) {
        return;
      }
      event.preventDefault();
      turnOff();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      root.classList.remove("phone-sim");
      root.style.removeProperty("--phone-safe-top");
      root.style.removeProperty("--phone-safe-bottom");
      root.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, turnOff]);

  if (!enabled) {
    return <>{children}</>;
  }

  if (!shellOk) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-near-black/95 p-6 text-center text-white">
          <div className="max-w-sm space-y-3">
            <p className="font-heading text-lg font-semibold uppercase tracking-wide">
              iPhone shell missing
            </p>
            <p className="text-sm text-white/70">
              Put the asset at{" "}
              <code className="text-titan-yellow">public/dev/iphone-shell.png</code>{" "}
              (gitignored — never deployed).
            </p>
            <button
              type="button"
              onClick={turnOff}
              className="inline-flex h-10 items-center justify-center rounded-sm bg-titan-yellow px-4 text-xs font-semibold uppercase tracking-wide text-dark-charcoal"
            >
              Exit
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[2147483000] flex flex-col overflow-x-hidden overscroll-none bg-[#050505]"
      role="dialog"
      aria-modal="true"
      aria-label="iPhone UI simulator"
    >
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#050505] px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-titan-yellow">
            iPhone preview
          </p>
          <p className="truncate text-xs text-white/55">
            Live DOM · click to select · Esc to exit
          </p>
        </div>
        <button
          type="button"
          onClick={turnOff}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-white/20 px-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/10"
        >
          <X className="size-3.5" aria-hidden="true" />
          Exit
        </button>
      </div>

      <div className="pointer-events-none flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-x-hidden overflow-y-hidden overscroll-none p-4 sm:p-6">
        <div className="relative aspect-[521/1024] w-[min(100%,22rem)] max-w-full shrink-0 sm:w-[min(100%,24rem)]">
          {/* Live app — selectable */}
          <div
            className="phone-sim-screen pointer-events-auto absolute overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{
              left: SCREEN.left,
              top: SCREEN.top,
              width: SCREEN.width,
              height: SCREEN.height,
              borderRadius: "12% / 5.5%",
            }}
          >
            <div className="phone-sim-scroll @container h-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {children}
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- local gitignored design asset */}
          <img
            src={`${SHELL_SRC}?v=2`}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain"
            onError={() => setShellOk(false)}
          />

          {/*
            Status chrome must sit above the shell image. Positioned to the
            screen hole; left/right clusters clear the Dynamic Island.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[60]"
            style={{
              left: SCREEN.left,
              top: SCREEN.top,
              width: SCREEN.width,
              height: "2.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: "5%",
              paddingRight: "5%",
              paddingTop: "0.45rem",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                lineHeight: 1,
                textShadow: "0 1px 2px rgba(0,0,0,0.65)",
              }}
            >
              <StatusTime />
            </span>
            <span style={{ flex: 1 }} />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.65))",
              }}
            >
              <CellularBars color="#ffffff" />
              <WifiIcon color="#ffffff" />
              <BatteryIcon color="#ffffff" level={0.82} />
            </span>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[60] flex justify-center"
            style={{
              left: SCREEN.left,
              top: `calc(${SCREEN.top} + ${SCREEN.height} - 1.1rem)`,
              width: SCREEN.width,
            }}
          >
            <span
              style={{
                height: 5,
                width: "36%",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.92)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Provider that frames the live app for selectable mobile UI review. */
export function DevIphoneShell({ children }: { children?: ReactNode }) {
  if (!designShellAllowed()) {
    return children ? <>{children}</> : null;
  }

  if (!children) {
    return null;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <DevIphoneShellRootInner>{children}</DevIphoneShellRootInner>
    </Suspense>
  );
}
