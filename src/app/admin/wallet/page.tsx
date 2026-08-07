import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Package,
  Truck,
} from "lucide-react";
import { WalletBalanceCard } from "@/components/admin/wallet-balance-card";
import { WalletCashFlowChart } from "@/components/admin/wallet-charts";
import { WalletExpenseMixCard } from "@/components/admin/wallet-expense-mix-card";
import { WalletJournalTable } from "@/components/admin/wallet-journal-table";
import { WalletOrderRevenueOverlay } from "@/components/admin/wallet-order-revenue-overlay";
import { WalletStripeConnectorCard } from "@/components/admin/wallet-stripe-connector-card";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { getApiStackReports } from "@/lib/data/api-stacks";
import { getWalletLedger } from "@/lib/data/wallet";
import { parseWalletPeriod, type WalletPeriod } from "@/lib/admin/wallet";
import { cn, formatCurrency } from "@/lib/utils";

type SearchParams = Promise<{ period?: string }>;

const PERIODS: { id: WalletPeriod; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All time" },
];

function periodHref(period: WalletPeriod) {
  return period === "30d" ? "/admin/wallet" : `/admin/wallet?period=${period}`;
}

function PnLRow({
  label,
  value,
  tone = "neutral",
  strong,
}: {
  label: string;
  value: number;
  tone?: "income" | "expense" | "neutral";
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-border-gray py-2.5 last:border-0",
        strong && "border-t border-dark-charcoal/20 pt-3",
      )}
    >
      <span
        className={cn(
          "text-sm text-dark-charcoal",
          strong && "font-heading text-xs font-semibold uppercase tracking-wide",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums text-sm font-semibold",
          tone === "income" && "text-emerald-700",
          tone === "expense" && "text-red-700",
          tone === "neutral" && "text-dark-charcoal",
          strong && "font-heading text-base",
        )}
      >
        {tone === "expense" && value > 0 ? "−" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default async function AdminWalletPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const period = parseWalletPeriod(params.period);
  const [ledger, apiStacks] = await Promise.all([
    getWalletLedger(period),
    getApiStackReports(),
  ]);
  const { summary } = ledger;
  const stripeStack =
    apiStacks.stacks.find((s) => s.id === "stripe") ?? null;
  const margin =
    summary.revenue > 0
      ? Math.round((summary.grossProfit / summary.revenue) * 1000) / 10
      : 0;

  return (
    <div className="space-y-5 @5xl:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Books · Cash control
          </p>
          <p className="mt-1 max-w-2xl text-sm text-medium-gray">
            Revenue from orders, shipping label costs, estimated product COGS,
            and supplies purchases — one register for platform finances.
          </p>
        </div>
        <div className="inline-flex flex-wrap rounded-sm border border-border-gray bg-white p-0.5">
          {PERIODS.map((p) => (
            <Link
              key={p.id}
              href={periodHref(p.id)}
              aria-current={period === p.id ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                period === p.id
                  ? "bg-dark-charcoal text-white"
                  : "text-medium-gray hover:text-dark-charcoal",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <WalletBalanceCard balance={summary.netIncome} />
        <DashboardStatCard
          label="Revenue"
          value={formatCurrency(summary.revenue + summary.shippingIncome)}
          hint={`${formatCurrency(summary.revenue)} product · ${formatCurrency(summary.shippingIncome)} shipping`}
          icon={ArrowUpRight}
          tone="green"
        />
        <DashboardStatCard
          label="Expenses"
          value={formatCurrency(summary.expenseTotal)}
          hint="Labels, COGS, supplies & other"
          icon={ArrowDownRight}
          tone="red"
        />
        <DashboardStatCard
          label="Gross margin"
          value={`${margin}%`}
          hint={`${formatCurrency(summary.grossProfit)} after COGS`}
          icon={Package}
          tone="yellow"
        />
        <DashboardStatCard
          label="Supplies on hand"
          value={formatCurrency(summary.suppliesOnHandValue)}
          hint="Warehouse stock value"
          icon={Boxes}
          tone="charcoal"
          href="/admin/inventory#supplies"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-sm border border-border-gray bg-white lg:col-span-3">
          <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Cash flow
            </h2>
            <p className="text-xs text-medium-gray">
              Daily income vs expense for the selected period
            </p>
          </div>
          <div className="px-2 py-4 @3xl:px-4">
            <WalletCashFlowChart data={ledger.cashFlow} />
          </div>
        </div>

        <WalletExpenseMixCard
          slices={ledger.expensesByCategory}
          transactions={ledger.transactions}
        />
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Profit &amp; loss
            </h2>
            <p className="text-xs text-medium-gray">
              Simplified P&amp;L for the selected period
            </p>
          </div>
          <div className="flex flex-1 flex-col px-4 py-2 @3xl:px-5">
            <PnLRow
              label="Product sales"
              value={summary.revenue}
              tone="income"
            />
            <PnLRow
              label="Shipping charged to customers"
              value={summary.shippingIncome}
              tone="income"
            />
            <PnLRow
              label="Other income"
              value={summary.otherIncome}
              tone="income"
            />
            <PnLRow
              label="Product cost (COGS)"
              value={summary.productCogs}
              tone="expense"
            />
            <PnLRow
              label="Gross profit"
              value={summary.grossProfit}
              strong
            />
            <PnLRow
              label="Shipping label costs"
              value={summary.shippingLabelExpense}
              tone="expense"
            />
            <PnLRow
              label="Product purchases"
              value={summary.productPurchaseExpense}
              tone="expense"
            />
            <PnLRow
              label="Supplies purchases"
              value={summary.suppliesExpense}
              tone="expense"
            />
            <PnLRow
              label="Other expenses"
              value={summary.otherExpense}
              tone="expense"
            />
            <PnLRow
              label="Net income"
              value={summary.netIncome}
              tone={summary.netIncome >= 0 ? "income" : "expense"}
              strong
            />
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Operating snapshot
            </h2>
            <p className="text-xs text-medium-gray">
              Quick links into cost centers
            </p>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-border-gray">
            <li>
              <WalletOrderRevenueOverlay
                revenueTotal={summary.revenue}
                orders={ledger.orderMargins}
              />
            </li>
            <li>
              <Link
                href="/admin/wallet"
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-light-gray/60 @3xl:px-5"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-orange-100 text-orange-700">
                  <Truck className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-dark-charcoal">
                    Shipping labels
                  </span>
                  <span className="block text-xs text-medium-gray">
                    {formatCurrency(summary.shippingLabelExpense)} carrier cost
                    booked
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/inventory#supplies"
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-light-gray/60 @3xl:px-5"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-dark-charcoal/10 text-dark-charcoal">
                  <Boxes className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-dark-charcoal">
                    Supplies
                  </span>
                  <span className="block text-xs text-medium-gray">
                    {formatCurrency(summary.suppliesExpense)} purchased ·{" "}
                    {formatCurrency(summary.suppliesOnHandValue)} on hand
                  </span>
                </span>
              </Link>
            </li>
            <li className="mt-auto">
              <Link
                href="/admin/products"
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-light-gray/60 @3xl:px-5"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-sky-100 text-sky-700">
                  <Package className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-dark-charcoal">
                    Product COGS
                  </span>
                  <span className="block text-xs text-medium-gray">
                    {formatCurrency(summary.productCogs)} estimated from product
                    cost × qty sold
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </div>

        <WalletStripeConnectorCard stack={stripeStack} />
      </section>

      <WalletJournalTable transactions={ledger.transactions} />
    </div>
  );
}
