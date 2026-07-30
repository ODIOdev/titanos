"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const TOP_LINKS = [
  { label: "Shop All", href: "/shop" },
  ...NAV_CATEGORIES,
  { label: "Brands", href: "/brands", children: [] as const },
  { label: "Resources", href: "/resources", children: [] as const },
] as const;

export function DesktopNavigation({ className }: { className?: string }) {
  const [openLabel, setOpenLabel] = React.useState<string | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu(label: string) {
    clearCloseTimer();
    setOpenLabel(label);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpenLabel(null);
    }, 120);
  }

  React.useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const linkClass =
    "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-sm px-1.5 py-2 text-xs font-semibold text-dark-charcoal transition-colors hover:bg-light-gray xl:px-2.5 xl:text-[13px]";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "hidden min-w-0 flex-1 items-center justify-center gap-0 lg:flex xl:gap-0.5",
        className,
      )}
    >
      {TOP_LINKS.map((item) => {
        const children =
          "children" in item && Array.isArray(item.children)
            ? item.children
            : [];
        const hasDropdown = children.length > 0;
        const isOpen = openLabel === item.label;

        if (!hasDropdown) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className={linkClass}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            className="relative shrink-0"
            onMouseEnter={() => openMenu(item.label)}
            onMouseLeave={scheduleClose}
          >
            <Link
              href={item.href}
              className={cn(linkClass, isOpen && "bg-light-gray")}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onFocus={() => openMenu(item.label)}
            >
              {item.label}
              <ChevronDown className="size-3 shrink-0 text-medium-gray" aria-hidden="true" />
            </Link>

            {isOpen ? (
              <div
                className="absolute left-1/2 top-full z-50 w-[min(36rem,70vw)] -translate-x-1/2 pt-2"
                onMouseEnter={() => openMenu(item.label)}
                onMouseLeave={scheduleClose}
              >
                <div className="rounded-sm border border-border-gray bg-white p-5 shadow-md">
                  <div className="mb-3 flex items-center justify-between gap-4 border-b border-border-gray pb-3">
                    <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                      {item.label}
                    </p>
                    <Link
                      href={item.href}
                      className="text-xs font-semibold uppercase tracking-wide text-medium-gray transition-colors hover:text-dark-charcoal"
                    >
                      Shop all
                    </Link>
                  </div>
                  <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={child.href}
                          className="block rounded-sm px-2 py-2 text-sm text-dark-charcoal transition-colors hover:bg-light-gray"
                          onClick={() => setOpenLabel(null)}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
