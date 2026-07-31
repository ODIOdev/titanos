"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "My account", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/quotes", label: "Quotes", icon: FileText },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const exact = "exact" in item && item.exact;
        const active = exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-dark-charcoal text-white"
                : "text-medium-gray hover:bg-white hover:text-dark-charcoal",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
