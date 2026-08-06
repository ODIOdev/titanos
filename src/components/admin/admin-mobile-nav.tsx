"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Smartphone, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { HomeButton } from "@/components/layout/home-button";
import { ADMIN_NAV, isAdminNavActive } from "@/components/admin/admin-nav-items";
import {
  designShellAllowed,
  openDevIphonePreview,
} from "@/components/dev/dev-iphone-shell";

/** Drawer replacement for the desktop sidebar below `lg`. */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const current = ADMIN_NAV.find(({ href }) => isAdminNavActive(href, pathname));

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="admin-mobile-topbar shrink-0 bg-dark-charcoal text-white @5xl:hidden">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 pb-3 pt-[calc(0.75rem+var(--phone-safe-top,0px)+env(safe-area-inset-top,0px))]">
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-white hover:bg-white/10"
            aria-label="Open admin menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <Link href="/admin" className="min-w-0">
            <p className="font-heading text-base font-semibold uppercase tracking-wide text-titan-yellow">
              Titan Safety
            </p>
            <p className="truncate text-xs text-white/60">
              {current?.label ?? "Admin Dashboard"}
            </p>
          </Link>
        </div>
      </div>

      {open ? (
        <div className="admin-mobile-drawer fixed inset-0 z-[60] @5xl:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-near-black/60"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-[min(17rem,85%)] max-w-full flex-col bg-dark-charcoal text-white shadow-xl outline-none"
          >
            <div
              className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-4"
              style={{
                paddingTop:
                  "calc(1rem + var(--phone-safe-top, 0px) + env(safe-area-inset-top, 0px))",
              }}
            >
              <Link href="/admin" onClick={() => setOpen(false)}>
                <p className="font-heading text-lg font-semibold uppercase tracking-wide text-titan-yellow">
                  Titan Safety
                </p>
                <p className="mt-0.5 text-xs text-white/60">Admin Dashboard</p>
              </Link>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-sm text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Close admin menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex-1 space-y-0.5 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Admin"
            >
              {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
                const active = isAdminNavActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-titan-yellow font-semibold text-dark-charcoal"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
              {designShellAllowed() ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openDevIphonePreview();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  title="Open local iPhone UI simulator (design only)"
                >
                  <Smartphone className="size-4 shrink-0" aria-hidden="true" />
                  iPhone preview
                </button>
              ) : null}
            </nav>

            <div className="space-y-0.5 border-t border-white/10 p-3">
              <HomeButton
                variant="sidebar"
                label="Back to website"
                onClick={() => setOpen(false)}
              />
              <form action={logout} onSubmit={() => setOpen(false)}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
