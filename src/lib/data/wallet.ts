import {
  buildCashFlowSeries,
  expenseBreakdown,
  isRecognizedOrderStatus,
  parseWalletJournal,
  parseWalletPeriod,
  periodStart,
  readShippingLabelCost,
  summarizeWallet,
  txnInPeriod,
  WALLET_CATEGORY_LABELS,
  WALLET_JOURNAL_KEY,
  type WalletCashFlowPoint,
  type WalletCategorySlice,
  type WalletJournal,
  type WalletOrderMargin,
  type WalletPeriod,
  type WalletSummary,
  type WalletTxn,
} from "@/lib/admin/wallet";
import { suppliesTotals } from "@/lib/admin/supplies-inventory";
import { getSuppliesInventory } from "@/lib/actions/supplies-inventory";
import { getAdminOrders } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type WalletLedger = {
  period: WalletPeriod;
  summary: WalletSummary;
  transactions: WalletTxn[];
  cashFlow: WalletCashFlowPoint[];
  expensesByCategory: WalletCategorySlice[];
  orderMargins: WalletOrderMargin[];
  journal: WalletJournal;
};

async function readJournal(): Promise<WalletJournal> {
  if (!isSupabaseConfigured()) return { entries: [] };
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", WALLET_JOURNAL_KEY)
      .maybeSingle();
    return parseWalletJournal(data?.value);
  } catch {
    return { entries: [] };
  }
}

function money(n: number) {
  return Math.round(Math.max(0, n) * 100) / 100;
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function deriveFromOrders(
  orders: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    email?: string | null;
    subtotal: number;
    shipping_amount: number;
    total: number;
    billing_address?: Record<string, unknown> | null;
    items?: {
      product_id: string | null;
      product_name: string;
      quantity: number;
      total_price: number;
    }[];
  }[],
  costByProductId: Map<string, number>,
): { txns: WalletTxn[]; orderMargins: WalletOrderMargin[] } {
  const txns: WalletTxn[] = [];
  const orderMargins: WalletOrderMargin[] = [];

  for (const order of orders) {
    if (!isRecognizedOrderStatus(order.status)) continue;

    const productRevenue = money(Number(order.subtotal) || 0);
    if (productRevenue > 0) {
      txns.push({
        id: `order:${order.id}:revenue`,
        source: "derived",
        date: order.created_at,
        direction: "credit",
        category: "order_revenue",
        amount: productRevenue,
        label: `Sale · ${order.order_number}`,
        note: WALLET_CATEGORY_LABELS.order_revenue,
        href: `/admin/orders/${order.id}`,
      });
    }

    const shippingCharged = money(Number(order.shipping_amount) || 0);
    if (shippingCharged > 0) {
      txns.push({
        id: `order:${order.id}:shipping-income`,
        source: "derived",
        date: order.created_at,
        direction: "credit",
        category: "shipping_income",
        amount: shippingCharged,
        label: `Shipping charged · ${order.order_number}`,
        href: `/admin/orders/${order.id}`,
      });
    }

    const labelCost = readShippingLabelCost(order.billing_address);
    if (labelCost && labelCost.carrierCost > 0) {
      txns.push({
        id: `order:${order.id}:label`,
        source: "derived",
        date: order.created_at,
        direction: "debit",
        category: "shipping_label",
        amount: labelCost.carrierCost,
        label: `Label cost · ${order.order_number}`,
        note:
          labelCost.feeAmount > 0
            ? `Carrier ${money(labelCost.carrierCost)} · fee income in shipping`
            : undefined,
        href: `/admin/orders/${order.id}`,
      });
    }

    let cogs = 0;
    for (const item of order.items ?? []) {
      if (!item.product_id) continue;
      const unitCost = costByProductId.get(item.product_id) ?? 0;
      cogs += unitCost * (Number(item.quantity) || 0);
    }
    cogs = money(cogs);
    if (cogs > 0) {
      txns.push({
        id: `order:${order.id}:cogs`,
        source: "derived",
        date: order.created_at,
        direction: "debit",
        category: "product_cogs",
        amount: cogs,
        label: `COGS · ${order.order_number}`,
        href: `/admin/orders/${order.id}`,
      });
    }

    if (productRevenue > 0 || cogs > 0) {
      const margin = roundMoney(productRevenue - cogs);
      orderMargins.push({
        orderId: order.id,
        orderNumber: order.order_number,
        date: order.created_at,
        status: order.status,
        email: (order.email ?? "").trim(),
        revenue: productRevenue,
        cogs,
        margin,
        marginPct:
          productRevenue > 0
            ? Math.round((margin / productRevenue) * 1000) / 10
            : null,
        href: `/admin/orders/${order.id}`,
      });
    }
  }

  return { txns, orderMargins };
}

function parseSupplierNote(note: string | undefined): {
  name?: string;
  qty?: number;
  sku?: string;
} {
  if (!note?.trim()) return {};
  // Supplier · Name × 10 · SKU WGG-0002
  const withSku = /^Supplier · (.+) × (\d+) · SKU (.+)$/i.exec(note.trim());
  if (withSku) {
    return {
      name: withSku[1].trim(),
      qty: Number(withSku[2]),
      sku: withSku[3].trim(),
    };
  }
  // Supplier · Name × 10
  const plain = /^Supplier · (.+) × (\d+)$/i.exec(note.trim());
  if (plain) {
    return { name: plain[1].trim(), qty: Number(plain[2]) };
  }
  const skuOnly = /(?:^|·\s*)SKU\s+(\S+)/i.exec(note);
  return skuOnly ? { sku: skuOnly[1].trim() } : {};
}

function manualToTxns(journal: WalletJournal): WalletTxn[] {
  return journal.entries.map((e) => {
    const parsed = parseSupplierNote(e.note);
    return {
      id: `manual:${e.id}`,
      source: "manual" as const,
      date: e.date,
      direction: e.direction,
      category: e.category,
      amount: e.amount,
      label:
        e.note?.trim() ||
        WALLET_CATEGORY_LABELS[e.category] ||
        "Journal entry",
      note: e.note,
      sku: parsed.sku,
    };
  });
}

async function loadProductCatalog(): Promise<{
  costByProductId: Map<string, number>;
  skuByName: Map<string, string>;
}> {
  const costByProductId = new Map<string, number>();
  const skuByName = new Map<string, string>();
  if (!isSupabaseConfigured()) return { costByProductId, skuByName };
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, cost");
    for (const p of products ?? []) {
      const cost = Number(p.cost);
      if (Number.isFinite(cost) && cost > 0) {
        costByProductId.set(p.id, cost);
      }
      const name = typeof p.name === "string" ? p.name.trim().toLowerCase() : "";
      const sku = typeof p.sku === "string" ? p.sku.trim() : "";
      if (name && sku) skuByName.set(name, sku);
    }
  } catch {
    // leave empty
  }
  return { costByProductId, skuByName };
}

function enrichTxnSkus(
  txns: WalletTxn[],
  skuByName: Map<string, string>,
): WalletTxn[] {
  return txns.map((t) => {
    if (t.sku || t.category !== "product_purchase") return t;
    const parsed = parseSupplierNote(t.note ?? t.label);
    if (parsed.sku) return { ...t, sku: parsed.sku };
    if (parsed.name) {
      const sku = skuByName.get(parsed.name.toLowerCase());
      if (sku) {
        return {
          ...t,
          sku,
          label: t.label.includes("SKU")
            ? t.label
            : `${t.label.replace(/\s*$/, "")} · SKU ${sku}`,
        };
      }
    }
    return t;
  });
}

export async function getWalletLedger(
  periodRaw?: string,
): Promise<WalletLedger> {
  const period = parseWalletPeriod(periodRaw);
  const start = periodStart(period);

  const [journal, supplies, orders, catalog] = await Promise.all([
    readJournal(),
    getSuppliesInventory(),
    getAdminOrders(),
    loadProductCatalog(),
  ]);

  const derived = deriveFromOrders(
    orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      created_at: o.created_at,
      email: o.email,
      subtotal: Number(o.subtotal),
      shipping_amount: Number(o.shipping_amount),
      total: Number(o.total),
      billing_address: o.billing_address ?? null,
      items: o.items?.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        total_price: i.total_price,
      })),
    })),
    catalog.costByProductId,
  );

  const all = enrichTxnSkus(
    [...derived.txns, ...manualToTxns(journal)].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
    catalog.skuByName,
  );

  const filtered = all.filter((t) => txnInPeriod(t, start));
  const orderMargins = derived.orderMargins
    .filter((row) => !start || new Date(row.date).getTime() >= start.getTime())
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  const suppliesOnHandValue = suppliesTotals(supplies).value;

  return {
    period,
    summary: summarizeWallet(filtered, suppliesOnHandValue),
    transactions: filtered,
    cashFlow: buildCashFlowSeries(filtered, period),
    expensesByCategory: expenseBreakdown(filtered),
    orderMargins,
    journal,
  };
}
