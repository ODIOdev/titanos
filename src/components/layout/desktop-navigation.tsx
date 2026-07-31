"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const DEPARTMENT_LINKS = NAV_CATEGORIES;

const SECONDARY_LINKS = [
  { label: "Brands", href: "/brands" },
  { label: "Resources", href: "/resources" },
] as const;

function pathMatches(pathname: string, href: string) {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

function departmentParam(href: string) {
  try {
    return new URL(href, "http://local").searchParams.get("department");
  } catch {
    return null;
  }
}

export function DesktopNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDepartment = searchParams.get("department");
  const [openLabel, setOpenLabel] = React.useState<string | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const navRef = React.useRef<HTMLElement>(null);

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
    }, 140);
  }

  function closeMenu() {
    clearCloseTimer();
    setOpenLabel(null);
  }

  React.useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  React.useEffect(() => {
    setOpenLabel(null);
  }, [pathname]);

  React.useEffect(() => {
    if (!openLabel) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) closeMenu();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openLabel]);

  const itemClass = (active: boolean, open = false) =>
    cn(
      "group relative inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-2.5 font-heading text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 xl:px-3 xl:text-[13px]",
      active || open
        ? "bg-near-black text-titan-yellow"
        : "text-dark-charcoal hover:bg-light-gray hover:text-dark-charcoal",
    );

  const shopAllActive = pathname === "/shop" && !activeDepartment;

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className={cn(
        "hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-1.5",
        className,
      )}
    >
      <Link href="/shop" className={itemClass(shopAllActive)}>
        Shop All
      </Link>

      <span
        aria-hidden="true"
        className="mx-1 hidden h-5 w-px shrink-0 bg-border-gray xl:block"
      />

      {DEPARTMENT_LINKS.map((item) => {
        const children = item.children ?? [];
        const isOpen = openLabel === item.label;
        const dept = departmentParam(item.href);
        const isActive =
          (dept != null && activeDepartment === dept) ||
          children.some((child) => pathMatches(pathname, child.href));

        return (
          <div
            key={item.label}
            className="relative shrink-0"
            onMouseEnter={() => openMenu(item.label)}
            onMouseLeave={scheduleClose}
          >
            <Link
              href={item.href}
              className={itemClass(isActive, isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onFocus={() => openMenu(item.label)}
            >
              {item.label}
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 opacity-60 transition-transform duration-200",
                  isOpen && "rotate-180 opacity-100",
                )}
                aria-hidden="true"
              />
            </Link>

            {isOpen ? (
              <div
                className="absolute left-1/2 top-full z-50 w-[min(28rem,72vw)] -translate-x-1/2 pt-2"
                onMouseEnter={() => openMenu(item.label)}
                onMouseLeave={scheduleClose}
              >
                <div className="overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_16px_40px_rgba(16,24,32,0.12)] ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-3 border-b border-border-gray bg-light-gray/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-dark-charcoal">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs text-medium-gray">
                        Browse categories in this department
                      </p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-dark-charcoal transition-colors hover:text-titan-yellow"
                      onClick={closeMenu}
                    >
                      View all
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>

                  <ul className="grid grid-cols-2 gap-0.5 p-2">
                    {children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={child.href}
                          className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-dark-charcoal transition-colors hover:bg-light-gray hover:text-near-black"
                          onClick={closeMenu}
                        >
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-titan-yellow"
                          />
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

      <span
        aria-hidden="true"
        className="mx-1 hidden h-5 w-px shrink-0 bg-border-gray xl:block"
      />

      {SECONDARY_LINKS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={itemClass(pathMatches(pathname, item.href))}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
