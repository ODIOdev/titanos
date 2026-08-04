import {
  BadgePercent,
  ChartColumnBig,
  ClipboardList,
  FileText,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

/** Shared by the desktop sidebar and the mobile drawer. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Dept./ Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/members", label: "Members", icon: UserCog },
  { href: "/admin/affiliates", label: "Affiliates", icon: BadgePercent },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/resources", label: "Resources", icon: FileText },
  {
    href: "/admin/analytics",
    label: "Analytics & Reports",
    icon: ChartColumnBig,
  },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function isAdminNavActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
