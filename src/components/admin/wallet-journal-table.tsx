"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  addWalletJournalEntry,
  deleteWalletJournalEntry,
} from "@/lib/actions/wallet";
import {
  WALLET_CATEGORY_LABELS,
  type WalletCategory,
  type WalletDirection,
  type WalletManualEntry,
  type WalletTxn,
} from "@/lib/admin/wallet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const MANUAL_CATEGORIES: {
  value: WalletManualEntry["category"];
  label: string;
  direction: WalletDirection;
}[] = [
  { value: "supplies_purchase", label: "Supplies purchase", direction: "debit" },
  { value: "product_purchase", label: "Product purchase", direction: "debit" },
  { value: "product_cogs", label: "Product COGS", direction: "debit" },
  { value: "manual_expense", label: "Other expense", direction: "debit" },
  { value: "manual_income", label: "Other income", direction: "credit" },
  { value: "adjustment", label: "Adjustment", direction: "debit" },
  { value: "other", label: "Other", direction: "debit" },
];

function CategoryBadge({ category }: { category: WalletCategory }) {
  const tone =
    category === "order_revenue" ||
    category === "shipping_income" ||
    category === "manual_income"
      ? "success"
      : category === "shipping_label" ||
          category === "product_cogs" ||
          category === "product_purchase" ||
          category === "supplies_purchase"
        ? "warning"
        : "default";
  return <Badge variant={tone}>{WALLET_CATEGORY_LABELS[category]}</Badge>;
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-dark-charcoal">{children}</dd>
    </div>
  );
}

function parseTxnRefs(txn: WalletTxn) {
  const orderMatch = /^order:([^:]+):(.*)$/.exec(txn.id);
  const manualMatch = /^manual:(.+)$/.exec(txn.id);
  return {
    orderId: orderMatch?.[1] ?? null,
    orderKind: orderMatch?.[2] ?? null,
    manualId: manualMatch?.[1] ?? null,
  };
}

/** Short display code for overlays / lists (keeps legacy IDs working). */
function formatTxnCode(txn: WalletTxn): { code: string; kind: string } {
  const refs = parseTxnRefs(txn);

  if (refs.manualId) {
    // New style already TX-XXXXXX
    if (/^TX-[A-Z0-9]{4,8}$/i.test(refs.manualId)) {
      return { code: refs.manualId.toUpperCase(), kind: "Manual" };
    }
    // Legacy wj-…-u7buz → TX-U7BUZ
    const parts = refs.manualId.split("-").filter(Boolean);
    const tail = (parts[parts.length - 1] ?? refs.manualId)
      .replace(/[^a-z0-9]/gi, "")
      .slice(-6)
      .toUpperCase();
    return { code: `TX-${tail || "MANUAL"}`, kind: "Manual" };
  }

  if (refs.orderId) {
    const orderNo =
      /(?:Sale|Shipping charged|Label cost|COGS)\s*·\s*(\S+)/i.exec(txn.label)?.[1] ??
      null;
    if (orderNo) {
      return { code: orderNo.toUpperCase(), kind: "Order" };
    }
    const short = refs.orderId.replace(/-/g, "").slice(-6).toUpperCase();
    const suffix = (refs.orderKind ?? "line")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase();
    return {
      code: `ORD-${short}${suffix ? `-${suffix}` : ""}`,
      kind: "Order",
    };
  }

  const fallback = txn.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
  return { code: `TX-${fallback || "LINE"}`, kind: "Txn" };
}

function TransactionDetailDialog({
  txn,
  open,
  onOpenChange,
  onDelete,
  deleting,
}: {
  txn: WalletTxn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}) {
  if (!txn) return null;

  const refs = parseTxnRefs(txn);
  const txnCode = formatTxnCode(txn);
  const isIncome = txn.direction === "credit";
  const sku =
    txn.sku?.trim() ||
    /(?:^|·\s*)SKU\s+(\S+)/i.exec(txn.note ?? txn.label)?.[1]?.trim() ||
    null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transaction"
      description={
        sku ? `${txn.label.includes("SKU") ? txn.label : `${txn.label} · ${sku}`}` : txn.label
      }
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div
          className={cn(
            "rounded-sm border px-4 py-3",
            isIncome
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-red-200 bg-red-50/70",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
            {isIncome ? "Income" : "Expense"}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-3xl font-bold tabular-nums",
              isIncome ? "text-emerald-700" : "text-red-700",
            )}
          >
            {isIncome ? "+" : "−"}
            {formatCurrency(txn.amount)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DetailField label="Date">{formatDateTime(txn.date)}</DetailField>
          <DetailField label="Direction">
            <span className="capitalize">{txn.direction}</span>
          </DetailField>
          <DetailField label="Category">
            <CategoryBadge category={txn.category} />
          </DetailField>
          <DetailField label="Source">
            <Badge variant={txn.source === "manual" ? "warning" : "default"}>
              {txn.source === "manual" ? "Manual entry" : "Derived"}
            </Badge>
          </DetailField>
          {sku ? (
            <DetailField label="SKU" className="col-span-2">
              <span className="font-mono text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                {sku}
              </span>
            </DetailField>
          ) : null}
          <DetailField label="Description" className="col-span-2">
            <span className="font-medium">{txn.label}</span>
          </DetailField>
          {txn.note && txn.note !== txn.label ? (
            <DetailField label="Memo / note" className="col-span-2">
              {txn.note}
            </DetailField>
          ) : null}
          <DetailField label="Reference" className="col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm border border-border-gray bg-light-gray px-2 py-1 font-mono text-sm font-semibold tracking-wide text-dark-charcoal">
                {txnCode.code}
              </span>
              <span className="text-xs text-medium-gray">{txnCode.kind}</span>
            </div>
          </DetailField>
          {refs.orderId ? (
            <DetailField label="Linked order" className="col-span-2">
              <Link
                href={`/admin/orders/${refs.orderId}`}
                className="text-sm font-medium text-safety-yellow underline-offset-2 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                View order
              </Link>
            </DetailField>
          ) : null}
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-gray pt-3">
          <div className="flex flex-wrap gap-2">
            {txn.href ? (
              <Link
                href={txn.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5",
                )}
                onClick={() => onOpenChange(false)}
              >
                Open related
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {txn.source === "manual" && onDelete ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                className="gap-1.5"
                disabled={deleting}
                onClick={() => onDelete(txn.id)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function AddJournalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] =
    useState<WalletManualEntry["category"]>("supplies_purchase");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const meta = MANUAL_CATEGORIES.find((c) => c.value === category);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add journal entry"
      description="Record a supplies purchase, product cost, or other cash movement."
      className="max-w-md"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const amt = Number(amount);
          if (!Number.isFinite(amt) || amt <= 0) {
            toast.error("Enter a valid amount.");
            return;
          }
          startTransition(async () => {
            const result = await addWalletJournalEntry({
              category,
              direction: meta?.direction ?? "debit",
              amount: amt,
              note,
              date: date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
            });
            if (!result.success) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
            setAmount("");
            setNote("");
            onOpenChange(false);
            router.refresh();
          });
        }}
      >
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
            Category
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {MANUAL_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                  category === c.value
                    ? "border-dark-charcoal bg-light-gray"
                    : "border-border-gray hover:border-dark-charcoal/40",
                )}
              >
                <span className="font-medium text-dark-charcoal">{c.label}</span>
                <span className="ml-2 text-xs uppercase text-medium-gray">
                  {c.direction}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Amount ($)"
            type="number"
            min={0}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Input
          label="Memo"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Vendor, invoice #…"
        />
        <div className="flex justify-end gap-2 border-t border-border-gray pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Post entry"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function WalletJournalTable({
  transactions,
}: {
  transactions: WalletTxn[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [detailTxn, setDetailTxn] = useState<WalletTxn | null>(null);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const PAGE_SIZE = 25;

  const rows = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.direction === filter);
  }, [transactions, filter]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of rows) {
      if (t.direction === "credit") income += t.amount;
      else expense += t.amount;
    }
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, rows.length);

  function setFilterAndReset(next: "all" | "credit" | "debit") {
    setFilter(next);
    setPage(1);
  }

  function removeManual(id: string) {
    const manualId = id.replace(/^manual:/, "");
    startTransition(async () => {
      const result = await deleteWalletJournalEntry(manualId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setDetailTxn(null);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="space-y-3 border-b border-border-gray px-4 py-3 @3xl:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Transactions
            </h2>
            <p className="text-xs text-medium-gray">
              Sales, labels, COGS, and manual entries
              {rows.length > 0
                ? ` · showing ${rangeStart}–${rangeEnd} of ${rows.length}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-sm border border-border-gray bg-light-gray/60 p-0.5">
              {(
                [
                  ["all", "All"],
                  ["credit", "Income"],
                  ["debit", "Expense"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterAndReset(id)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                    filter === id
                      ? "bg-white text-dark-charcoal shadow-sm"
                      : "text-medium-gray hover:text-dark-charcoal",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setOpen(true)}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add entry
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 overflow-hidden rounded-sm border border-border-gray bg-light-gray/50">
          <div className="px-3 py-2 text-right @3xl:border-r @3xl:border-border-gray">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Income
            </dt>
            <dd className="mt-0.5 font-heading text-base font-semibold tabular-nums text-emerald-700">
              {formatCurrency(totals.income)}
            </dd>
          </div>
          <div className="border-l border-border-gray px-3 py-2 text-right @3xl:border-r">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Expense
            </dt>
            <dd className="mt-0.5 font-heading text-base font-semibold tabular-nums text-red-700">
              {formatCurrency(totals.expense)}
            </dd>
          </div>
          <div className="border-l border-border-gray px-3 py-2 text-right">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Subtotal
            </dt>
            <dd
              className={cn(
                "mt-0.5 font-heading text-base font-semibold tabular-nums",
                totals.net >= 0 ? "text-dark-charcoal" : "text-red-700",
              )}
            >
              {formatCurrency(totals.net)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-light-gray">
              <th className="px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                Date
              </th>
              <th className="px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                Description
              </th>
              <th className="px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                Category
              </th>
              <th className="px-4 py-2.5 text-right font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                Income
              </th>
              <th className="px-4 py-2.5 text-right font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                Expense
              </th>
              <th className="w-12 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer border-b border-border-gray last:border-0 hover:bg-light-gray/50"
                onClick={() => setDetailTxn(t)}
              >
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-medium-gray">
                  {formatDate(t.date)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-medium text-dark-charcoal underline-offset-2 group-hover:underline">
                    {t.label}
                  </span>
                  {t.source === "manual" ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                      Manual
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5">
                  <CategoryBadge category={t.category} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">
                  {t.direction === "credit" ? formatCurrency(t.amount) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-red-700">
                  {t.direction === "debit" ? formatCurrency(t.amount) : "—"}
                </td>
                <td
                  className="px-2 py-2.5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.source === "manual" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-700 hover:border-red-300 hover:bg-red-50"
                      disabled={pending}
                      aria-label="Delete entry"
                      onClick={() => removeManual(t.id)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-medium-gray"
                >
                  No transactions in this period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-gray px-4 py-3 @3xl:px-5">
          <p className="text-xs text-medium-gray">
            Page {currentPage} of {totalPages} · {PAGE_SIZE} per page
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <AddJournalDialog open={open} onOpenChange={setOpen} />
      <TransactionDetailDialog
        txn={detailTxn}
        open={detailTxn != null}
        onOpenChange={(next) => {
          if (!next) setDetailTxn(null);
        }}
        onDelete={removeManual}
        deleting={pending}
      />
    </section>
  );
}
