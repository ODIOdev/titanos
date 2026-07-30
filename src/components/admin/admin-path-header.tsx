"use client";

import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";

const TITLES: { match: RegExp; title: string; description?: string }[] = [
  { match: /^\/admin\/products\/new$/, title: "New product" },
  { match: /^\/admin\/products\/[^/]+$/, title: "Edit product" },
  { match: /^\/admin\/products$/, title: "Products", description: "Manage catalog SKUs" },
  { match: /^\/admin\/categories\/new$/, title: "New category" },
  { match: /^\/admin\/categories\/[^/]+$/, title: "Category details" },
  { match: /^\/admin\/categories$/, title: "Categories", description: "Organize catalog taxonomy" },
  { match: /^\/admin\/orders\/[^/]+$/, title: "Order details" },
  { match: /^\/admin\/orders$/, title: "Orders" },
  { match: /^\/admin\/customers$/, title: "Customers" },
  { match: /^\/admin\/quotes\/[^/]+$/, title: "Quote review" },
  { match: /^\/admin\/quotes$/, title: "Quotes" },
  { match: /^\/admin\/inventory$/, title: "Inventory" },
  { match: /^\/admin\/brands$/, title: "Brands" },
  { match: /^\/admin\/resources$/, title: "Resources" },
  { match: /^\/admin\/settings$/, title: "Settings" },
  { match: /^\/admin$/, title: "Overview", description: "Store performance at a glance" },
];

export function AdminPathHeader({
  userEmail,
  actions,
}: {
  userEmail?: string | null;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const found = TITLES.find((t) => t.match.test(pathname));

  return (
    <AdminHeader
      title={found?.title ?? "Admin"}
      description={found?.description}
      userEmail={userEmail}
      actions={actions}
    />
  );
}
