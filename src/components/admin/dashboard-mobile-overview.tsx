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
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

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
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/admin/inventory", label: "Stock", icon: Warehouse },
  { href: "/admin/products/new", label: "Add SKU", icon: PackagePlus },
  { href: "/admin/products", label: "Catalog", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
];

const TONE_STYLES = {
  orange: "bg-orange-100/80 text-orange-800",
  red: "bg-red-100/80 text-red-800",
  blue: "bg-sky-100/80 text-sky-800",
} as const;

const GLASS =
  "rounded-sm border border-white/70 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.05)] backdrop-blur-md";

/**
 * Mobile-only overview — compressed glass controls + work feed.
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
    <div className="admin-mobile-overview min-w-0 space-y-3 overflow-x-hidden @5xl:hidden">
      <section aria-label="Key metrics">
        <ul className="grid grid-cols-2 gap-1.5">
          {kpis.map((kpi) => {
            const body = (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                  {kpi.label}
                </p>
                <p className="mt-1 truncate font-heading text-base font-bold tabular-nums leading-none text-dark-charcoal">
                  {kpi.value}
                </p>
                <p className="mt-1 truncate text-[10px] text-medium-gray">
                  {kpi.hint}
                </p>
              </>
            );
            const className = cn("block min-w-0 px-2.5 py-2", GLASS);
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

      {attention.length > 0 ? (
        <section aria-label="Needs attention" className="flex flex-wrap gap-1.5">
          {attention.map((item) => {
            const Icon = ATTENTION_ICONS[item.kind];
            return (
              <Link
                key={item.kind}
                href={item.href}
                className={cn(
                  "inline-flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2",
                  GLASS,
                  "active:bg-white/80",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-sm",
                    TONE_STYLES[item.tone],
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="truncate text-xs font-semibold text-dark-charcoal">
                      {item.label}
                    </span>
                    <span className="font-heading text-sm font-bold tabular-nums">
                      {item.count}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </section>
      ) : (
        <p className="rounded-sm border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2 text-xs text-emerald-900 backdrop-blur-sm">
          All clear — nothing urgent.
        </p>
      )}

      <section aria-label="Quick actions">
        <ul className="grid grid-cols-4 gap-1.5">
          {QUICK_ACTIONS.slice(0, 8).map(({ href, label, icon: Icon }) => (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  "flex h-full min-w-0 flex-col items-center gap-1 px-1 py-2 text-center active:bg-white/80",
                  GLASS,
                )}
              >
                <Icon className="size-3.5 text-dark-charcoal" aria-hidden="true" />
                <span className="w-full truncate text-[10px] font-semibold leading-tight text-dark-charcoal">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Work queue"
        className="min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white"
      >
        <div className="border-b border-border-gray px-2.5 pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
              Queue
            </h2>
            <Link
              href={viewAllHref}
              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-medium-gray"
            >
              View all
            </Link>
          </div>
          <div
            role="tablist"
            aria-label="Work queue sections"
            className="mt-1.5 flex"
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
                    "flex min-w-0 flex-1 items-center justify-center gap-1 border-b-2 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide",
                    selected
                      ? "border-titan-yellow text-dark-charcoal"
                      : "border-transparent text-medium-gray",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={cn(
                      "rounded-sm px-1 py-0.5 text-[9px] tabular-nums",
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

        <div role="tabpanel">
          {tab === "orders" ? (
            <ul className="divide-y divide-border-gray">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex min-w-0 items-center gap-2 px-2.5 py-2 active:bg-light-gray"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-dark-charcoal">
                          {order.order_number}
                        </span>
                        <OrderStatusBadge
                          status={order.status}
                          className="scale-90 origin-left"
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-medium-gray">
                        {order.email} · {formatDateTime(order.created_at)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-dark-charcoal">
                      {formatCurrency(order.total)}
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
                    className="flex min-w-0 items-center gap-2 px-2.5 py-2 active:bg-light-gray"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-dark-charcoal">
                      {product.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-bold tabular-nums",
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
                    className="flex min-w-0 items-center gap-2 px-2.5 py-2 active:bg-light-gray"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-dark-charcoal">
                        {quote.company ?? quote.contact_name}
                      </span>
                      <span className="block truncate text-[10px] text-medium-gray">
                        {quote.quote_number}
                      </span>
                    </span>
                    <span className="max-w-[4.5rem] shrink-0 truncate text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
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
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-2.5 py-4 text-center text-xs text-medium-gray">
      {children}
    </li>
  );
}
