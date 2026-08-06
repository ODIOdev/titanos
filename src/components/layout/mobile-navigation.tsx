"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { NAV_CATEGORIES, SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { WISHLIST_CHANGE_EVENT, readWishlist } from "@/lib/wishlist";
import { HomeButton } from "@/components/layout/home-button";

export interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Admins get a shortcut into the CRM; the desktop header has no equivalent. */
  isAdmin?: boolean;
  /** The utility bar is desktop-only, so auth lives here on small screens. */
  signedIn?: boolean;
}

const EXTRA_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Brands", href: "/brands" },
  { label: "Resources", href: "/resources" },
  { label: "Bulk Orders", href: "/bulk-orders" },
  { label: "Request a Quote", href: "/quote" },
] as const;

const panelLinkClass =
  "block w-full px-4 py-3 text-left text-sm font-medium text-dark-charcoal";

function useWishlistCount() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    function sync() {
      setCount(readWishlist().length);
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WISHLIST_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WISHLIST_CHANGE_EVENT, sync);
    };
  }, []);

  return count;
}

export function MobileNavigation({
  open,
  onOpenChange,
  isAdmin = false,
  signedIn = false,
}: MobileNavigationProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const wishlistCount = useWishlistCount();

  React.useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("mobile-nav-open");

    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable[0] ?? panel).focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("mobile-nav-open");
      previouslyFocused.current?.focus();
    };
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  const expandedKey = open ? expanded : null;

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      tabIndex={-1}
      className="storefront-mobile-nav fixed inset-0 z-[60] flex flex-col bg-white outline-none @5xl:hidden"
    >
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/12 bg-dark-charcoal px-3"
        style={{
          paddingTop:
            "calc(0.65rem + var(--phone-safe-top, 0px) + env(safe-area-inset-top, 0px))",
          paddingBottom: "0.65rem",
        }}
      >
        <Image
          src="/images/logo/logo-landscape.png"
          alt={SITE_CONFIG.name}
          width={763}
          height={247}
          className="h-8 w-auto max-w-[min(100%,12rem)] object-contain object-left"
          unoptimized
        />
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-white"
          aria-label="Close menu"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingBottom:
            "calc(1rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="py-2">
          <HomeButton
            className="mx-4 my-2 w-[calc(100%-2rem)] justify-start"
            onClick={() => onOpenChange(false)}
          />
          {NAV_CATEGORIES.map((category) => {
            const isOpen = expandedKey === category.label;
            return (
              <div key={category.label} className="border-b border-border-gray">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-dark-charcoal"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpanded((prev) =>
                      prev === category.label ? null : category.label,
                    )
                  }
                >
                  {category.label}
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-medium-gray transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <ul className="bg-light-gray/70 pb-2">
                    <li>
                      <Link
                        href={category.href}
                        className="block px-6 py-2.5 text-sm font-medium text-dark-charcoal"
                        onClick={() => onOpenChange(false)}
                      >
                        Shop all {category.label}
                      </Link>
                    </li>
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={child.href}
                          className="block px-6 py-2.5 text-sm text-dark-charcoal"
                          onClick={() => onOpenChange(false)}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          <ul className="py-2">
            {EXTRA_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={panelLinkClass}
                  onClick={() => onOpenChange(false)}
                >
                  {link.href === "/wishlist" && wishlistCount > 0
                    ? `${link.label} (${wishlistCount})`
                    : link.label}
                </Link>
              </li>
            ))}
            <li>
              {signedIn ? (
                <form action={logout} onSubmit={() => onOpenChange(false)}>
                  <button type="submit" className={panelLinkClass}>
                    Sign Out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className={panelLinkClass}
                  onClick={() => onOpenChange(false)}
                >
                  Sign In / Register
                </Link>
              )}
            </li>
            {isAdmin ? (
              <li className="mt-4 border-t border-border-gray pt-4">
                <Link
                  href="/admin"
                  className={panelLinkClass}
                  onClick={() => onOpenChange(false)}
                >
                  Admin Dashboard
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
