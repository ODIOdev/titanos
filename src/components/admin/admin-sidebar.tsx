"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  ChartColumnBig,
  ClipboardList,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { HomeButton } from "@/components/layout/home-button";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/members", label: "Members", icon: UserCog },
  { href: "/admin/affiliates", label: "Affiliates", icon: BadgePercent },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/resources", label: "Resources", icon: FileText },
  { href: "/admin/analytics", label: "Analytics & Reports", icon: ChartColumnBig },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col self-start bg-dark-charcoal text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="block">
          <p className="font-heading text-xl font-semibold uppercase tracking-wide text-titan-yellow">
            Titan Safety
          </p>
          <p className="mt-0.5 text-xs text-white/60">Admin Dashboard</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
