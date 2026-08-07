"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  WALLET_CATEGORY_LABELS,
  type WalletCategory,
  type WalletCategorySlice,
  type WalletTxn,
} from "@/lib/admin/wallet";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const PALETTE = [
  "bg-dark-charcoal",
  "bg-warning-orange",
  "bg-sky-600",
  "bg-emerald-700",
  "bg-zinc-500",
  "bg-amber-600",
];

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export function WalletExpenseMixCard({
  slices,
  transactions,
}: {
  slices: WalletCategorySlice[];
  transactions: WalletTxn[];
}) {
  const [selected, setSelected] = useState<WalletCategory | null>(null);

  const total = useMemo(
    () => slices.reduce((sum, row) => sum + row.amount, 0),
    [slices],
  );

  const detailRows = useMemo(() => {
    if (!selected) return [];
    return transactions
      .filter((t) => t.direction === "debit" && t.category === selected)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [transactions, selected]);

  const detailTotal = useMemo(
    () => money(detailRows.reduce((s, t) => s + t.amount, 0)),
    [detailRows],
  );

  const selectedLabel = selected
    ? WALLET_CATEGORY_LABELS[selected]
    : null;

  if (slices.length === 0) {
    return (
      <div className="overflow-hidden rounded-sm border border-border-gray bg-white lg:col-span-2">
        <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            Expense mix
          </h2>
          <p className="text-xs text-medium-gray">
            Where money went this period
          </p>
        </div>
        <p className="flex min-h-[220px] items-center justify-center px-4 text-sm text-medium-gray">
          No expenses in this period.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border-gray bg-white lg:col-span-2">
      <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
        {selected ? (
          <div className="flex items-start gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-0.5 h-8 shrink-0 gap-1.5 px-2.5"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back
            </Button>
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                {selectedLabel}
              </h2>
              <p className="text-xs text-medium-gray">
                {detailRows.length} line
                {detailRows.length === 1 ? "" : "s"} ·{" "}
                {formatCurrency(detailTotal)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Expense mix
            </h2>
            <p className="text-xs text-medium-gray">
              Where money went this period · tap a category for detail
            </p>
          </>
        )}
      </div>

      {selected ? (
        <div className="flex max-h-[320px] min-h-[220px] flex-col">
          <ul className="min-h-0 flex-1 divide-y divide-border-gray overflow-y-auto">
            {detailRows.map((t) => (
              <li key={t.id}>
                {t.href ? (
                  <Link
                    href={t.href}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-light-gray/60 @3xl:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-dark-charcoal">
                        {t.label}
                      </span>
                      <span className="block text-[11px] tabular-nums text-medium-gray">
                        {formatDate(t.date)}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-red-700">
                      {formatCurrency(t.amount)}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 @3xl:px-5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-dark-charcoal">
                        {t.label}
                      </span>
                      <span className="block text-[11px] tabular-nums text-medium-gray">
                        {formatDate(t.date)}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-red-700">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                )}
              </li>
            ))}
            {detailRows.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-medium-gray">
                No lines in this category.
              </li>
            ) : null}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-border-gray bg-light-gray/50 px-4 py-3 @3xl:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Category total
            </p>
            <p className="font-heading text-base font-semibold tabular-nums text-dark-charcoal">
              {formatCurrency(detailTotal)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col justify-between gap-5 px-4 py-4 @3xl:px-5">
          <ul className="space-y-2">
            {slices.map((row, index) => {
              const share = total > 0 ? (row.amount / total) * 100 : 0;
              return (
                <li key={row.category}>
                  <button
                    type="button"
                    onClick={() => setSelected(row.category)}
                    className="w-full rounded-sm border border-transparent px-2 py-2 text-left transition-colors hover:border-border-gray hover:bg-light-gray/50"
                  >
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark-charcoal">
                          {row.label}
                        </p>
                        <p className="text-[11px] tabular-nums text-medium-gray">
                          {share.toFixed(1)}% of expenses
                        </p>
                      </div>
                      <p className="shrink-0 font-heading text-sm font-semibold tabular-nums text-dark-charcoal">
                        {formatCurrency(row.amount)}
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-border-gray/60">
                      <div
                        className={cn(
                          "h-full rounded-sm",
                          PALETTE[index % PALETTE.length],
                        )}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-border-gray pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Total expenses
            </p>
            <p className="font-heading text-base font-semibold tabular-nums text-dark-charcoal">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
