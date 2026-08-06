"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Smartphone } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { HomeButton } from "@/components/layout/home-button";
import { ADMIN_NAV, isAdminNavActive } from "@/components/admin/admin-nav-items";
import {
  designShellAllowed,
  openDevIphonePreview,
} from "@/components/dev/dev-iphone-shell";

export function AdminSidebar() {
  const pathname = usePathname();
  const showPhonePreview = designShellAllowed();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col self-start bg-dark-charcoal text-white @5xl:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="block">
          <p className="font-heading text-xl font-semibold uppercase tracking-wide text-titan-yellow">
            Titan Safety
          </p>
          <p className="mt-0.5 text-xs text-white/60">Admin Dashboard</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = isAdminNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-titan-yellow text-dark-charcoal font-semibold"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
        {showPhonePreview ? (
          <button
            type="button"
            onClick={openDevIphonePreview}
            className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
            title="Open local iPhone UI simulator (design only)"
          >
            <Smartphone className="size-4 shrink-0" aria-hidden="true" />
            iPhone preview
          </button>
        ) : null}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 p-3">
        <HomeButton variant="sidebar" label="Back to website" />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
