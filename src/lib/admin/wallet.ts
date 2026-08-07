/** Wallet / budget journal — derived ledger + optional manual entries. */

export const WALLET_JOURNAL_KEY = "wallet_journal";

export type WalletDirection = "credit" | "debit";

export type WalletCategory =
  | "order_revenue"
  | "shipping_income"
  | "shipping_label"
  | "product_cogs"
  | "product_purchase"
  | "supplies_purchase"
  | "manual_income"
  | "manual_expense"
  | "adjustment"
  | "other";

export type WalletTxnSource = "derived" | "manual";

export type WalletTxn = {
  id: string;
  source: WalletTxnSource;
  date: string;
  direction: WalletDirection;
  category: WalletCategory;
  amount: number;
  label: string;
  note?: string;
  href?: string;
  /** Product SKU when known (supplier buys, etc.). */
  sku?: string;
};

export type WalletManualEntry = {
  id: string;
  date: string;
  direction: WalletDirection;
  category: Extract<
    WalletCategory,
    | "supplies_purchase"
    | "product_purchase"
    | "manual_income"
    | "manual_expense"
    | "adjustment"
    | "other"
    | "product_cogs"
  >;
  amount: number;
  note?: string;
  createdAt: string;
};

export type WalletJournal = {
  entries: WalletManualEntry[];
};

export type WalletPeriod = "7d" | "30d" | "90d" | "all";

export type WalletSummary = {
  revenue: number;
  shippingIncome: number;
  shippingLabelExpense: number;
  productCogs: number;
  productPurchaseExpense: number;
  suppliesExpense: number;
  otherExpense: number;
  otherIncome: number;
  grossProfit: number;
  netIncome: number;
  expenseTotal: number;
  incomeTotal: number;
  suppliesOnHandValue: number;
  txnCount: number;
};

export type WalletCashFlowPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

export type WalletCategorySlice = {
  category: WalletCategory;
  label: string;
  amount: number;
  direction: WalletDirection;
};

/** Per-order product margin for the selected wallet period. */
export type WalletOrderMargin = {
  orderId: string;
  orderNumber: string;
  date: string;
  status: string;
  email: string;
  revenue: number;
  cogs: number;
  margin: number;
  marginPct: number | null;
  href: string;
};

export const WALLET_CATEGORY_LABELS: Record<WalletCategory, string> = {
  order_revenue: "Product sales",
  shipping_income: "Shipping charged",
  shipping_label: "Shipping labels",
  product_cogs: "Product cost (COGS)",
  product_purchase: "Product purchases",
  supplies_purchase: "Supplies purchases",
  manual_income: "Other income",
  manual_expense: "Other expense",
  adjustment: "Adjustment",
  other: "Other",
};

export function emptyWalletJournal(): WalletJournal {
  return { entries: [] };
}

function newId() {
  // Short public ref: TX-A7K2M9 (no ambiguous 0/O/1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `TX-${code}`;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function money(n: number) {
  return Math.round(Math.max(0, n) * 100) / 100;
}

function signedMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function parseWalletJournal(value: unknown): WalletJournal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyWalletJournal();
  }
  const raw = value as { entries?: unknown };
  const list = Array.isArray(raw.entries) ? raw.entries : [];
  const entries: WalletManualEntry[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const amount = money(asNumber(row.amount));
    if (amount <= 0) continue;
    const direction =
      row.direction === "credit" || row.direction === "debit"
        ? row.direction
        : "debit";
    const categoryRaw = String(row.category ?? "other");
    const allowed: WalletManualEntry["category"][] = [
      "supplies_purchase",
      "product_purchase",
      "manual_income",
      "manual_expense",
      "adjustment",
      "other",
      "product_cogs",
    ];
    const category = allowed.includes(
      categoryRaw as WalletManualEntry["category"],
    )
      ? (categoryRaw as WalletManualEntry["category"])
      : "other";
    const date =
      typeof row.date === "string" && row.date
        ? row.date
        : new Date().toISOString();
    entries.push({
      id:
        typeof row.id === "string" && row.id
          ? row.id
          : newId(),
      date,
      direction,
      category,
      amount,
      note:
        typeof row.note === "string" && row.note.trim()
          ? row.note.trim()
          : undefined,
      createdAt:
        typeof row.createdAt === "string" && row.createdAt
          ? row.createdAt
          : date,
    });
  }
  return { entries };
}

export function createWalletManualEntry(input: {
  date?: string;
  direction: WalletDirection;
  category: WalletManualEntry["category"];
  amount: number;
  note?: string;
}): WalletManualEntry {
  const now = new Date().toISOString();
  return {
    id: newId(),
    date: input.date?.trim() || now,
    direction: input.direction,
    category: input.category,
    amount: money(input.amount),
    note: input.note?.trim() || undefined,
    createdAt: now,
  };
}

export function periodStart(period: WalletPeriod, now = new Date()): Date | null {
  if (period === "all") return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export function parseWalletPeriod(value: string | undefined): WalletPeriod {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") {
    return value;
  }
  return "30d";
}

export function txnInPeriod(txn: WalletTxn, start: Date | null): boolean {
  if (!start) return true;
  return new Date(txn.date).getTime() >= start.getTime();
}

export function signedAmount(txn: WalletTxn): number {
  return txn.direction === "credit" ? txn.amount : -txn.amount;
}

export function summarizeWallet(
  txns: WalletTxn[],
  suppliesOnHandValue: number,
): WalletSummary {
  let revenue = 0;
  let shippingIncome = 0;
  let shippingLabelExpense = 0;
  let productCogs = 0;
  let productPurchaseExpense = 0;
  let suppliesExpense = 0;
  let otherExpense = 0;
  let otherIncome = 0;

  for (const t of txns) {
    switch (t.category) {
      case "order_revenue":
        revenue += t.amount;
        break;
      case "shipping_income":
        shippingIncome += t.amount;
        break;
      case "shipping_label":
        shippingLabelExpense += t.amount;
        break;
      case "product_cogs":
        productCogs += t.amount;
        break;
      case "product_purchase":
        productPurchaseExpense += t.amount;
        break;
      case "supplies_purchase":
        suppliesExpense += t.amount;
        break;
      case "manual_income":
        otherIncome += t.amount;
        break;
      case "manual_expense":
      case "adjustment":
      case "other":
        if (t.direction === "credit") otherIncome += t.amount;
        else otherExpense += t.amount;
        break;
    }
  }

  const incomeTotal = money(revenue + shippingIncome + otherIncome);
  const expenseTotal = money(
    shippingLabelExpense +
      productCogs +
      productPurchaseExpense +
      suppliesExpense +
      otherExpense,
  );
  const grossProfit = signedMoney(revenue - productCogs);
  const netIncome = signedMoney(incomeTotal - expenseTotal);

  return {
    revenue: money(revenue),
    shippingIncome: money(shippingIncome),
    shippingLabelExpense: money(shippingLabelExpense),
    productCogs: money(productCogs),
    productPurchaseExpense: money(productPurchaseExpense),
    suppliesExpense: money(suppliesExpense),
    otherExpense: money(otherExpense),
    otherIncome: money(otherIncome),
    grossProfit,
    netIncome,
    expenseTotal,
    incomeTotal,
    suppliesOnHandValue: money(suppliesOnHandValue),
    txnCount: txns.length,
  };
}

export function buildCashFlowSeries(
  txns: WalletTxn[],
  period: WalletPeriod,
): WalletCashFlowPoint[] {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const useDays = period === "all" ? 30 : days;
  const points: WalletCashFlowPoint[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = useDays - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    let income = 0;
    let expense = 0;
    for (const t of txns) {
      const td = new Date(t.date);
      if (td.toDateString() !== d.toDateString()) continue;
      if (t.direction === "credit") income += t.amount;
      else expense += t.amount;
    }
    points.push({
      date: label,
      income: money(income),
      expense: money(expense),
      net: money(income - expense),
    });
  }
  return points;
}

export function expenseBreakdown(txns: WalletTxn[]): WalletCategorySlice[] {
  const map = new Map<WalletCategory, number>();
  for (const t of txns) {
    if (t.direction !== "debit") continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      label: WALLET_CATEGORY_LABELS[category],
      amount: money(amount),
      direction: "debit" as const,
    }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function readShippingLabelCost(
  billingAddress: Record<string, unknown> | null | undefined,
): { carrierCost: number; charged: number; feeAmount: number } | null {
  if (!billingAddress || typeof billingAddress !== "object") return null;
  const label = billingAddress.shipping_label;
  if (!label || typeof label !== "object") return null;
  const row = label as Record<string, unknown>;
  const carrierCost = money(asNumber(row.carrier_cost));
  const charged = money(asNumber(row.charged));
  const feeAmount = money(asNumber(row.fee_amount));
  if (carrierCost <= 0 && charged <= 0) return null;
  return { carrierCost, charged, feeAmount };
}

/** Orders that count toward recognized revenue (excludes pending / cancelled / refunded). */
export function isRecognizedOrderStatus(status: string): boolean {
  return !["pending", "cancelled", "refunded"].includes(status);
}
