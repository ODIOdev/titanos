import {
  ChartColumnBig,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

/** Shared by the desktop sidebar and the mobile drawer. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
  { href: "/admin/categories", label: "Products/ Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/supplier", label: "Supplier", icon: Truck },
  {
    href: "/admin/analytics",
    label: "Analytics & Reports",
    icon: ChartColumnBig,
  },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function isAdminNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  // Products lives under Products/ Categories — keep that nav item active on SKU pages.
  if (href === "/admin/categories") {
    return (
      pathname.startsWith("/admin/categories") ||
      pathname.startsWith("/admin/products")
    );
  }
  // Users directory covers customers, team members, and affiliates.
  if (href === "/admin/users") {
    return (
      pathname.startsWith("/admin/users") ||
      pathname.startsWith("/admin/customers") ||
      pathname.startsWith("/admin/members") ||
      pathname.startsWith("/admin/affiliates")
    );
  }
  return pathname.startsWith(href);
}
