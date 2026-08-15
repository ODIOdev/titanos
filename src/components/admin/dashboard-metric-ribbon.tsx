import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Boxes,
  ClipboardList,
  PackageX,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type OpsChip = {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  alert?: boolean;
};

export function DashboardMetricRibbon({
  revenue,
  ordersCount,
  openOrders,
  aov,
  bestDayLabel,
  usersCount,
  cancelledOrders,
  pendingQuotes,
  lowStockCount,
  suppliesUnits,
  suppliesValue,
  suppliesAlert,
  skuCount,
}: {
  revenue: number;
  ordersCount: number;
  openOrders: number;
  aov: number;
  bestDayLabel: string | null;
  usersCount: number;
  cancelledOrders: number;
  pendingQuotes: number;
  lowStockCount: number;
  suppliesUnits: number;
  suppliesValue: number;
  suppliesAlert: boolean;
  skuCount: number;
}) {
  const ops: OpsChip[] = [
    {
      label: "Quotes",
      value: String(pendingQuotes),
      href: "/admin/quotes",
      icon: ClipboardList,
      alert: pendingQuotes > 0,
    },
    {
      label: "Low stock",
      value: String(lowStockCount),
      href: "/admin/inventory",
      icon: PackageX,
      alert: lowStockCount > 0,
    },
    {
      label: "Open",
      value: String(openOrders),
      href: "/admin/orders",
      icon: Receipt,
      alert: openOrders > 0,
    },
    {
      label: "Cancelled",
      value: String(cancelledOrders),
      href: "/admin/orders?status=cancelled",
      icon: Ban,
      alert: cancelledOrders > 0,
    },
    {
      label: "Supplies",
      value: String(suppliesUnits),
      href: "/admin/inventory#supplies",
      icon: Boxes,
      alert: suppliesAlert,
    },
    {
      label: "SKUs",
      value: String(skuCount),
      href: "/admin/products",
      icon: ShoppingBag,
    },
  ];

  return (
    <section className="space-y-2" aria-label="Overview metrics">
      <div className="grid gap-2 lg:grid-cols-12">
        {/* Revenue hero */}
        <Link
          href="/admin/wallet"
          className={cn(
            "group relative isolate overflow-hidden rounded-sm border border-dark-charcoal bg-dark-charcoal px-4 py-3 text-white lg:col-span-4",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            "transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
          )}
        >
          <span
            className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-titan-yellow/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                Revenue
              </p>
              <p className="mt-1 font-heading text-3xl font-bold tabular-nums leading-none tracking-tight text-titan-yellow">
                {formatCurrency(revenue)}
              </p>
              <p className="mt-1.5 text-[11px] text-white/55">
                Paid & fulfilled · Open wallet
              </p>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-titan-yellow font-heading text-xs font-bold text-dark-charcoal">
              $
            </span>
          </div>
        </Link>

        {/* Primary KPIs */}
        <div className="grid grid-cols-3 gap-2 lg:col-span-8">
          <PrimaryKpi
            href="/admin/orders"
            label="Orders"
            value={String(ordersCount)}
            hint={`${openOrders} still open`}
            icon={ShoppingBag}
          />
          <PrimaryKpi
            label="Avg order"
            value={formatCurrency(aov)}
            hint={bestDayLabel ? `Peak ${bestDayLabel}` : "No sales yet"}
            icon={TrendingUp}
            highlight
          />
          <PrimaryKpi
            href="/admin/users"
            label="Users"
            value={String(usersCount)}
            hint="Registered accounts"
            icon={Users}
          />
        </div>
      </div>

      {/* Ops strip */}
      <div
        className={cn(
          "grid grid-cols-3 overflow-hidden rounded-sm border border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.04)] backdrop-blur-md sm:grid-cols-6",
        )}
      >
        {ops.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <Link
              key={chip.label}
              href={chip.href}
              className={cn(
                "group relative flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/80",
                index > 0 && "border-l border-white/60",
                chip.alert && "bg-red-50/40",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-sm border border-white/60 bg-white/70 text-dark-charcoal",
                  chip.alert && "border-red-200 bg-red-100 text-red-700",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                  {chip.label}
                </span>
                <span
                  className={cn(
                    "block font-heading text-base font-bold tabular-nums leading-none text-dark-charcoal",
                    chip.alert && "text-red-700",
                  )}
                >
                  {chip.value}
                </span>
              </span>
              {chip.label === "Supplies" ? (
                <span className="ml-auto hidden truncate text-[10px] text-medium-gray xl:inline">
                  {formatCurrency(suppliesValue)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PrimaryKpi({
  href,
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
}: {
  href?: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  const className = cn(
    "relative isolate flex min-w-0 flex-col justify-between overflow-hidden rounded-sm border px-3 py-2.5 backdrop-blur-md transition-all",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.05)]",
    highlight
      ? "border-titan-yellow/60 bg-titan-yellow/20"
      : "border-white/70 bg-white/55 hover:-translate-y-px hover:bg-white/80",
    href &&
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
  );

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
          {label}
        </p>
        <span className="flex size-6 items-center justify-center rounded-sm border border-white/50 bg-white/70 text-dark-charcoal">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums leading-none text-dark-charcoal">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] text-medium-gray">{hint}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
