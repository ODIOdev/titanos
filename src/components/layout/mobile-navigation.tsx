"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { NAV_CATEGORIES, SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXTRA_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Brands", href: "/brands" },
  { label: "Resources", href: "/resources" },
  { label: "Bulk Orders", href: "/bulk-orders" },
  { label: "Request a Quote", href: "/quote" },
  { label: "Sign In / Register", href: "/account" },
] as const;

export function MobileNavigation({ open, onOpenChange }: MobileNavigationProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable[0] ?? panel).focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
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

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onOpenChange]);

  const expandedKey = open ? expanded : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-near-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border-gray px-4 py-3">
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            {SITE_CONFIG.shortName}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label="Close menu"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
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
                      prev === category.label ? null : category.label
                    )
                  }
                >
                  {category.label}
                  <ChevronDown
                    className={cn(
                      "size-4 text-medium-gray transition-transform",
                      isOpen && "rotate-180"
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
                  className="block px-4 py-3 text-sm font-medium text-dark-charcoal hover:bg-light-gray"
                  onClick={() => onOpenChange(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
