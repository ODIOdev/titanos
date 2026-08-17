"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const { showBanner, accept, decline } = useCookieConsent();
  const bannerRef = useRef<HTMLElement>(null);
  const isAdmin = pathname.startsWith("/admin");
  const visible = showBanner && !isAdmin;

  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.classList.remove("cookie-banner-open");
      root.style.removeProperty("--cookie-banner-offset");
      return;
    }

    const el = bannerRef.current;
    if (!el) return;

    const sync = () => {
      root.classList.add("cookie-banner-open");
      root.style.setProperty("--cookie-banner-offset", `${el.offsetHeight}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.classList.remove("cookie-banner-open");
      root.style.removeProperty("--cookie-banner-offset");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <aside
      ref={bannerRef}
      className="cookie-consent-banner @container fixed z-[55] border-t border-white/10 bg-dark-charcoal text-white shadow-[0_-12px_32px_rgba(16,24,32,0.28)]"
      role="region"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-copy"
    >
      <div className="flex flex-col gap-3 px-4 py-3.5 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-6 @3xl:px-6 @3xl:py-4">
        <div className="min-w-0 @3xl:max-w-3xl">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-titan-yellow">
            Cookies
          </p>
          <p id="cookie-consent-copy" className="mt-1 text-sm leading-relaxed text-white/80">
            {SITE_CONFIG.name} uses necessary cookies to keep your cart and account
            working. With your permission, we also use analytics cookies to measure
            traffic. See our{" "}
            <Link
              href="/privacy#cookies"
              className="text-white underline underline-offset-2 hover:text-titan-yellow"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outlineInverse"
            size="sm"
            className="flex-1 @3xl:flex-none"
            onClick={decline}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="flex-1 @3xl:flex-none"
            onClick={accept}
          >
            Accept
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function CookieSettingsButton({
  className,
  children = "Cookies",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { openPreferences } = useCookieConsent();
  return (
    <button type="button" className={className} onClick={openPreferences}>
      {children}
    </button>
  );
}
