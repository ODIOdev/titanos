import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Package,
  Scale,
  Truck,
  Warehouse,
} from "lucide-react";
import { SupplierPurchasePanel } from "@/components/admin/supplier-purchase-panel";
import { buttonVariants } from "@/components/ui/button";
import { getProductStockQuantity } from "@/lib/catalog/product-stock";
import { suppliesTotals } from "@/lib/admin/supplies-inventory";
import { getSuppliesInventory } from "@/lib/actions/supplies-inventory";
import { getAdminProducts } from "@/lib/data/admin";
import { getWalletLedger } from "@/lib/data/wallet";
import { cn, formatCurrency } from "@/lib/utils";

export default async function AdminSupplierPage() {
  const [ledger, supplies, products] = await Promise.all([
    getWalletLedger("all"),
    getSuppliesInventory(),
    getAdminProducts({ active: "active" }),
  ]);

  const balance = ledger.summary.netIncome;
  const supplyStats = suppliesTotals(supplies);
  const productRows = products.map((p) => {
    const stock = getProductStockQuantity(p);
    const cost = Math.max(0, Number(p.cost) || 0);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      cost,
      stock,
      value: Math.round(cost * stock * 100) / 100,
    };
  });
  const catalogValue = productRows.reduce((sum, row) => sum + row.value, 0);
  const catalogUnits = productRows.reduce((sum, row) => sum + row.stock, 0);
  const stockValue = Math.round((catalogValue + supplyStats.value) * 100) / 100;

  const supplyEntries = [...supplies.boxes, ...supplies.items];

  return (
    <div className="space-y-5 @5xl:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Procurement · Stock in
          </p>
          <p className="mt-1 text-sm text-medium-gray">
            Spend wallet balance to buy product stock and packing supplies.
            Purchases debit the platform balance and raise on-hand inventory
            value.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/wallet"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            Wallet
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/admin/inventory"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            Inventory
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 @5xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-sm border-2 border-titan-yellow bg-dark-charcoal p-5 text-white shadow-[0_10px_28px_rgba(16,24,32,0.2)] @5xl:col-span-2 @5xl:p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-titan-yellow/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-titan-yellow">
                Spendable balance
              </p>
              <p className="mt-1 text-xs text-white/60">
                All-time wallet net · income minus expenses
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
              <Scale className="size-5" aria-hidden="true" />
            </span>
          </div>
          <p
            className={cn(
              "relative mt-5 font-heading text-4xl font-bold tabular-nums tracking-tight @5xl:text-5xl",
              balance >= 0 ? "text-titan-yellow" : "text-red-300",
            )}
          >
            {formatCurrency(balance)}
          </p>
          <p className="relative mt-3 text-xs text-white/55">
            Deposit via Stripe on Wallet, then buy stock here.
          </p>
        </div>

        <StatCard
          label="Catalog stock value"
          value={formatCurrency(catalogValue)}
          hint={`${catalogUnits.toLocaleString()} units · cost × qty`}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          label="Supplies on hand"
          value={formatCurrency(supplyStats.value)}
          hint={`${supplyStats.units} units · ${supplyStats.entryCount} lines`}
          icon={Boxes}
          href="/admin/inventory#supplies"
        />
      </section>

      <section className="grid gap-3 @5xl:grid-cols-3">
        <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
          <div className="flex items-center gap-2">
            <Warehouse className="size-4 text-medium-gray" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
              Total inventory value
            </p>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
            {formatCurrency(stockValue)}
          </p>
          <p className="mt-1 text-xs text-medium-gray">
            Products + packing supplies at cost
          </p>
        </div>
        <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-medium-gray" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
              Product purchases
            </p>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
            {formatCurrency(ledger.summary.productPurchaseExpense)}
          </p>
          <p className="mt-1 text-xs text-medium-gray">
            Supplier product buys all-time
          </p>
        </div>
        <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-medium-gray" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
              Supplies purchased
            </p>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
            {formatCurrency(ledger.summary.suppliesExpense)}
          </p>
          <p className="mt-1 text-xs text-medium-gray">
            Boxes &amp; items bought all-time
          </p>
        </div>
      </section>

      <SupplierPurchasePanel
        balance={balance}
        products={productRows.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          cost: p.cost,
          stock: p.stock,
        }))}
        supplies={supplyEntries}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-sm border border-border-gray bg-white p-4 transition-colors hover:border-dark-charcoal/35 @5xl:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
          {label}
        </p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-light-gray text-dark-charcoal">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal @5xl:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-medium-gray">{hint}</p>
    </Link>
  );
}
