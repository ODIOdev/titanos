"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  FileText,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/resources", label: "Resources", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-dark-charcoal text-white">
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

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Boxes className="size-4" aria-hidden="true" />
          View storefront
        </Link>
      </div>
    </aside>
  );
}
