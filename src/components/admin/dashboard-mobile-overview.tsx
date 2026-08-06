"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  Package,
  PackagePlus,
  PackageX,
  Receipt,
  ShoppingBag,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type AttentionTone = "orange" | "red" | "blue";
type AttentionKind = "quotes" | "stock" | "orders";

export type MobileAttentionItem = {
  kind: AttentionKind;
  href: string;
  label: string;
  count: number;
  hint: string;
  tone: AttentionTone;
};

type RecentOrder = {
  id: string;
  order_number: string;
  email: string;
  created_at: string;
  status: string;
  total: number;
};

type LowStockProduct = {
  id: string;
  name: string;
  inventory_quantity: number;
};

type OpenQuote = {
  id: string;
  company: string | null;
  contact_name: string;
  quote_number: string;
  status: string;
};

type Kpi = {
  label: string;
  value: string;
  hint: string;
  href?: string;
};

type DashboardMobileOverviewProps = {
  attention: MobileAttentionItem[];
  kpis: Kpi[];
  recentOrders: RecentOrder[];
  lowStock: LowStockProduct[];
  openQuotes: OpenQuote[];
};

type WorkTab = "orders" | "restock" | "quotes";

const ATTENTION_ICONS: Record<AttentionKind, LucideIcon> = {
  quotes: ClipboardList,
  stock: PackageX,
  orders: Receipt,
};

const QUICK_ACTIONS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Stock", icon: Warehouse },
  { href: "/admin/products/new", label: "Add SKU", icon: PackagePlus },
  { href: "/admin/products", label: "Catalog", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

const TONE_STYLES = {
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-sky-100 text-sky-800",
} as const;

/**
 * Mobile-only overview: stacked KPIs → attention → shortcuts → work feed.
 * No horizontal overflow. Desktop keeps the full analytics layout.
 */
export function DashboardMobileOverview({
  attention,
  kpis,
  recentOrders,
  lowStock,
  openQuotes,
}: DashboardMobileOverviewProps) {
  const defaultTab: WorkTab = attention.some((item) => item.kind === "quotes")
    ? "quotes"
    : attention.some((item) => item.kind === "stock")
      ? "restock"
      : "orders";

  const [tab, setTab] = useState<WorkTab>(defaultTab);

  const tabs: { id: WorkTab; label: string; count: number }[] = [
    { id: "orders", label: "Orders", count: recentOrders.length },
    { id: "restock", label: "Stock", count: lowStock.length },
    { id: "quotes", label: "Quotes", count: openQuotes.length },
  ];

  const viewAllHref =
    tab === "orders"
      ? "/admin/orders"
      : tab === "restock"
        ? "/admin/inventory"
        : "/admin/quotes";

  return (
    <div className="admin-mobile-overview min-w-0 space-y-4 overflow-x-hidden @5xl:hidden">
      {/* Snapshot — 2×2, no side scroll */}
      <section aria-label="Key metrics">
        <ul className="grid grid-cols-2 gap-2">
          {kpis.map((kpi) => {
            const body = (
              <>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                  {kpi.label}
                </p>
                <p className="mt-1 truncate font-heading text-lg font-semibold tabular-nums leading-none text-dark-charcoal">
                  {kpi.value}
                </p>
                <p className="mt-1 truncate text-[0.65rem] text-medium-gray">
                  {kpi.hint}
                </p>
              </>
            );
            const className =
              "block min-w-0 rounded-sm border border-border-gray bg-white p-3";
            return (
              <li key={kpi.label} className="min-w-0">
                {kpi.href ? (
                  <Link href={kpi.href} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Needs attention — compact rows */}
      {attention.length > 0 ? (
        <section aria-label="Needs attention">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
              Needs attention
            </h2>
            <p className="text-[0.65rem] tabular-nums text-medium-gray">
              {attention.reduce((sum, item) => sum + item.count, 0)} open
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {attention.map((item) => {
              const Icon = ATTENTION_ICONS[item.kind];
              return (
                <li key={item.kind}>
                  <Link
                    href={item.href}
                    className="flex min-w-0 items-center gap-2.5 rounded-sm border border-border-gray bg-white px-3 py-2.5 active:bg-light-gray"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-sm",
                        TONE_STYLES[item.tone],
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-dark-charcoal">
                          {item.label}
                        </span>
                        <span className="font-heading text-sm font-semibold tabular-nums text-dark-charcoal">
                          {item.count}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.65rem] text-medium-gray">
                        {item.hint}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section
          aria-label="All clear"
          className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5"
        >
          <p className="text-sm font-medium text-emerald-900">All clear</p>
          <p className="mt-0.5 text-[0.65rem] text-emerald-800/80">
            No urgent quotes, stock, or open orders.
          </p>
        </section>
      )}

      {/* Shortcuts — 3×2 grid, no side scroll */}
      <section aria-label="Quick actions">
        <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
          Jump to
        </h2>
        <ul className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className="flex h-full min-w-0 flex-col items-center gap-1.5 rounded-sm border border-border-gray bg-white px-1.5 py-2.5 text-center active:bg-light-gray"
              >
                <span className="flex size-8 items-center justify-center rounded-sm bg-light-gray text-dark-charcoal">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="w-full truncate text-[0.65rem] font-semibold leading-tight text-dark-charcoal">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Work queue */}
      <section
        aria-label="Work queue"
        className="min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white"
      >
        <div className="border-b border-border-gray px-3 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
              Work queue
            </h2>
            <Link
              href={viewAllHref}
              className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray"
            >
              View all
            </Link>
          </div>
          <div
            role="tablist"
            aria-label="Work queue sections"
            className="mt-2.5 flex"
          >
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-1 border-b-2 px-1 pb-2 text-[0.65rem] font-semibold uppercase tracking-wide transition-colors",
                    selected
                      ? "border-titan-yellow text-dark-charcoal"
                      : "border-transparent text-medium-gray",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={cn(
                      "rounded-sm px-1 py-0.5 text-[10px] tabular-nums",
                      selected
                        ? "bg-titan-yellow/25 text-dark-charcoal"
                        : "bg-light-gray text-medium-gray",
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div role="tabpanel" className="min-h-[10rem]">
          {tab === "orders" ? (
            <ul className="divide-y divide-border-gray">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex min-w-0 flex-col gap-1.5 px-3 py-3 active:bg-light-gray"
                  >
                    <span className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-dark-charcoal">
                        {order.order_number}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-dark-charcoal">
                        {formatCurrency(order.total)}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[0.65rem] text-medium-gray">
                        {order.email} · {formatDate(order.created_at)}
                      </span>
                      <Badge
                        variant="default"
                        className="max-w-[6.5rem] shrink-0 truncate"
                      >
                        {order.status}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
              {recentOrders.length === 0 ? (
                <EmptyRow>No orders yet.</EmptyRow>
              ) : null}
            </ul>
          ) : null}

          {tab === "restock" ? (
            <ul className="divide-y divide-border-gray">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex min-w-0 items-center gap-3 px-3 py-3 active:bg-light-gray"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-dark-charcoal">
                      {product.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        product.inventory_quantity <= 0
                          ? "text-red-700"
                          : "text-orange-700",
                      )}
                    >
                      {product.inventory_quantity}
                    </span>
                  </Link>
                </li>
              ))}
              {lowStock.length === 0 ? (
                <EmptyRow>Stock looks healthy.</EmptyRow>
              ) : null}
            </ul>
          ) : null}

          {tab === "quotes" ? (
            <ul className="divide-y divide-border-gray">
              {openQuotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="flex min-w-0 items-center gap-3 px-3 py-3 active:bg-light-gray"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-dark-charcoal">
                        {quote.company ?? quote.contact_name}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.65rem] text-medium-gray">
                        {quote.quote_number}
                      </span>
                    </span>
                    <span className="max-w-[5.5rem] shrink-0 truncate text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                      {quote.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              ))}
              {openQuotes.length === 0 ? (
                <EmptyRow>No open quotes.</EmptyRow>
              ) : null}
            </ul>
          ) : null}
        </div>
      </section>

      <p className="text-center text-[0.65rem] text-medium-gray">
        Full charts in{" "}
        <Link
          href="/admin/analytics"
          className="font-semibold text-dark-charcoal underline-offset-2 hover:underline"
        >
          Analytics
        </Link>
      </p>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-3 py-7 text-center text-sm text-medium-gray">
      {children}
    </li>
  );
}
