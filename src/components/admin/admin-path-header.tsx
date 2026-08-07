"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ADMIN_RETURN_PARAM, adminReturnTarget } from "@/lib/admin/return-to";

type RouteMeta = {
  match: RegExp;
  title: string;
  description?: string;
  /** Return null for list/top-level pages with no back target. */
  back?: (pathname: string) => { href: string; label: string } | null;
};

const TITLES: RouteMeta[] = [
  {
    match: /^\/admin\/products\/new$/,
    title: "New product",
    back: () => ({ href: "/admin/products", label: "Back to products" }),
  },
  {
    match: /^\/admin\/products\/[^/]+$/,
    title: "Edit product",
    back: () => ({ href: "/admin/products", label: "Back to products" }),
  },
  {
    match: /^\/admin\/products$/,
    title: "Products",
    description: "Manage catalog SKUs",
  },
  {
    match: /^\/admin\/categories\/new$/,
    title: "New category",
    back: () => ({ href: "/admin/categories", label: "Back to categories" }),
  },
  {
    match: /^\/admin\/categories\/([^/]+)\/edit$/,
    title: "Edit category",
    back: (pathname) => {
      const id = pathname.split("/")[3];
      return id
        ? { href: `/admin/categories/${id}`, label: "Back to category" }
        : { href: "/admin/categories", label: "Back to categories" };
    },
  },
  {
    match: /^\/admin\/categories\/[^/]+$/,
    title: "Category details",
    back: () => ({ href: "/admin/categories", label: "Back to categories" }),
  },
  {
    match: /^\/admin\/categories$/,
    title: "Products/ Categories",
  },
  {
    match: /^\/admin\/users$/,
    title: "Users",
    description: "Customers, team, and affiliates",
  },
  {
    match: /^\/admin\/members\/new$/,
    title: "New member",
    back: () => ({ href: "/admin/users?tab=members", label: "Back to users" }),
  },
  {
    match: /^\/admin\/members\/([^/]+)\/edit$/,
    title: "Edit member",
    back: (pathname) => {
      const id = pathname.split("/")[3];
      return id
        ? { href: `/admin/members/${id}`, label: "Back to member" }
        : { href: "/admin/users?tab=members", label: "Back to users" };
    },
  },
  {
    match: /^\/admin\/members\/[^/]+$/,
    title: "Member details",
    back: () => ({ href: "/admin/users?tab=members", label: "Back to users" }),
  },
  {
    match: /^\/admin\/orders\/new$/,
    title: "Create order",
    description: "Manual / phone / wholesale order",
    back: () => ({ href: "/admin/orders", label: "Back to orders" }),
  },
  {
    match: /^\/admin\/orders\/[^/]+$/,
    title: "Order details",
    description: "Process, ship, or return",
    back: () => ({ href: "/admin/orders", label: "Back to orders" }),
  },
  {
    match: /^\/admin\/orders$/,
    title: "Orders",
    description: "Process → pack → ship → deliver",
  },
  {
    match: /^\/admin\/customers\/([^/]+)\/edit$/,
    title: "Edit customer",
    back: (pathname) => {
      const id = pathname.split("/")[3];
      return id
        ? { href: `/admin/customers/${id}`, label: "Back to customer" }
        : { href: "/admin/users?tab=customers", label: "Back to users" };
    },
  },
  {
    match: /^\/admin\/customers\/[^/]+$/,
    title: "Customer details",
    back: () => ({
      href: "/admin/users?tab=customers",
      label: "Back to users",
    }),
  },
  {
    match: /^\/admin\/quotes\/[^/]+$/,
    title: "Quote review",
    back: () => ({ href: "/admin/quotes", label: "Back to quotes" }),
  },
  { match: /^\/admin\/quotes$/, title: "Quotes" },
  { match: /^\/admin\/inventory$/, title: "Inventory" },
  { match: /^\/admin\/brands\/new$/, title: "New brand", back: () => ({ href: "/admin/brands", label: "Back to brands" }) },
  {
    match: /^\/admin\/brands\/[^/]+\/edit$/,
    title: "Edit brand",
    back: (pathname) => {
      const id = pathname.split("/")[3];
      return id
        ? { href: `/admin/brands/${id}`, label: "Back to brand" }
        : { href: "/admin/brands", label: "Back to brands" };
    },
  },
  {
    match: /^\/admin\/brands\/[^/]+$/,
    title: "Brand details",
    description: "Logo, products, and linked categories",
    back: () => ({ href: "/admin/brands", label: "Back to brands" }),
  },
  { match: /^\/admin\/brands$/, title: "Brands", description: "Manufacturer catalog partners" },
  {
    match: /^\/admin\/analytics$/,
    title: "Analytics & reports",
    description: "Revenue pulse, category mix, and exports",
  },
  {
    match: /^\/admin\/wallet$/,
    title: "Wallet",
    description: "Budget journal, cash flow, and P&L",
  },
  { match: /^\/admin\/resources$/, title: "Resources" },
  {
    match: /^\/admin\/supplier$/,
    title: "Supplier",
    description: "Buy products and supplies with wallet balance",
  },
  { match: /^\/admin\/settings$/, title: "Settings" },
  {
    match: /^\/admin$/,
    title: "Overview",
    description: "Store performance at a glance",
  },
];

/** Prefers the list that linked here over the route's default parent. */
function BackLink({ fallback }: { fallback: { href: string; label: string } }) {
  const from = useSearchParams().get(ADMIN_RETURN_PARAM);
  const target = adminReturnTarget(from) ?? fallback;
  return <AdminBackLink href={target.href}>{target.label}</AdminBackLink>;
}

export function AdminPathHeader({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const found = TITLES.find((t) => t.match.test(pathname));
  const back = found?.back?.(pathname) ?? null;

  return (
    <AdminHeader
      title={found?.title ?? "Admin"}
      description={found?.description}
      back={
        back ? (
          <Suspense
            fallback={
              <AdminBackLink href={back.href}>{back.label}</AdminBackLink>
            }
          >
            <BackLink fallback={back} />
          </Suspense>
        ) : undefined
      }
      actions={actions}
    />
  );
}
