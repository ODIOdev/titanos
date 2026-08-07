import { CreditCard } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export type OrderPaymentSummary = {
  status: string;
  method: string;
  brand: string | null;
  last4: string | null;
  cardholderName: string | null;
  reference: string | null;
  total: number;
  currency: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(row: Record<string, unknown> | null, ...keys: string[]) {
  if (!row) return null;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Pull card / payment display fields from order columns + billing JSON. */
export function getOrderPaymentSummary(order: {
  payment_status?: string | null;
  status?: string | null;
  total?: number | null;
  currency?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  billing_address?: Record<string, unknown> | null;
  internal_notes?: string | null;
}): OrderPaymentSummary {
  const billing = asRecord(order.billing_address);
  const payment = asRecord(billing?.payment) ?? billing;

  let last4 = readString(payment, "card_last4", "last4", "last_4");
  let brand = readString(payment, "card_brand", "brand");
  let cardholderName = readString(
    payment,
    "cardholder_name",
    "name",
    "card_name",
  );
  let method =
    readString(payment, "payment_method", "method") ??
    (last4 ? "card" : null);

  const pi = order.stripe_payment_intent_id?.trim() || null;
  if (!last4 && pi) {
    const demoMatch = pi.match(/demo_pi_.+_(\d{4})$/i);
    if (demoMatch?.[1]) {
      last4 = demoMatch[1];
      method = method ?? "card";
      brand = brand ?? "visa";
    }
  }

  if (!last4 && order.internal_notes) {
    const noteMatch = order.internal_notes.match(/card ending\s+(\d{4})/i);
    if (noteMatch?.[1]) {
      last4 = noteMatch[1];
      method = method ?? "card";
    }
    const nameMatch = order.internal_notes.match(
      /card ending\s+\d{4}\s*·\s*(.+)$/i,
    );
    if (nameMatch?.[1] && !cardholderName) {
      cardholderName = nameMatch[1].trim();
    }
  }

  const rawStatus = (order.payment_status ?? "").trim().toLowerCase();
  const orderStatus = (order.status ?? "").trim().toLowerCase();
  let status =
    rawStatus && rawStatus !== "pending"
      ? rawStatus
      : ["paid", "processing", "shipped", "delivered"].includes(orderStatus)
        ? "paid"
        : rawStatus || "pending";

  // Normalize Stripe / processor failure codes to a single declined label.
  if (
    status === "failed" ||
    status === "card_declined" ||
    status === "declined" ||
    status === "requires_payment_method"
  ) {
    status = "declined";
  }

  return {
    status,
    method: method ?? "—",
    brand,
    last4,
    cardholderName,
    reference: pi || order.stripe_checkout_session_id || null,
    total: Number(order.total ?? 0),
    currency: (order.currency ?? "USD").toUpperCase(),
  };
}

function paymentStatusTone(status: string) {
  if (
    status === "paid" ||
    status === "succeeded" ||
    status === "complete"
  ) {
    return "bg-emerald-100 text-emerald-900";
  }
  if (status === "declined" || status === "failed") {
    return "bg-rose-100 text-rose-900";
  }
  if (status === "refunded") {
    return "bg-red-100 text-red-900";
  }
  if (status === "cancelled" || status === "expired") {
    return "bg-zinc-200 text-zinc-700";
  }
  return "bg-amber-100 text-amber-900";
}

function paymentStatusLabel(status: string) {
  if (status === "declined" || status === "failed") return "Declined";
  if (status === "paid" || status === "succeeded" || status === "complete") {
    return "Paid";
  }
  if (status === "refunded") return "Refunded";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "unpaid") return "Unpaid";
  return status;
}

export function OrderPaymentCard({
  payment,
  className,
}: {
  payment: OrderPaymentSummary;
  className?: string;
}) {
  const paid =
    payment.status === "paid" ||
    payment.status === "succeeded" ||
    payment.status === "complete";
  const declined =
    payment.status === "declined" || payment.status === "failed";
  const brandLabel = payment.brand ? titleCase(payment.brand) : "Card";
  const statusLabel = paymentStatusLabel(payment.status);

  return (
    <div
      className={cn(
        "rounded-sm border border-border-gray bg-white p-4 @5xl:p-5",
        declined && "border-rose-200",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-medium-gray" aria-hidden="true" />
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
            Payment
          </h3>
        </div>
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            paymentStatusTone(payment.status),
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 rounded-sm border border-border-gray bg-light-gray/40 px-3 py-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
          {declined ? "Amount attempted" : paid ? "Amount charged" : "Amount"}
        </p>
        <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
          {formatCurrency(payment.total)}
          <span className="ml-1.5 text-xs font-normal tracking-normal text-medium-gray">
            {payment.currency}
          </span>
        </p>
      </div>

      {payment.last4 ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-dark-charcoal/15 bg-[linear-gradient(145deg,#2a2a2a_0%,#1a1a1a_55%,#111_100%)] px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-white/55">
              {brandLabel}
            </p>
            <CreditCard className="size-4 text-titan-yellow" aria-hidden="true" />
          </div>
          <p className="mt-3 font-heading text-lg font-semibold tracking-[0.18em] tabular-nums">
            <span className="text-white/45">XXXX-</span>
            {payment.last4}
          </p>
          {payment.cardholderName ? (
            <p className="mt-2 truncate text-xs uppercase tracking-wide text-white/70">
              {payment.cardholderName}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-sm border border-dashed border-border-gray bg-light-gray/30 px-3 py-4 text-center">
          <CreditCard
            className="mx-auto size-5 text-medium-gray"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm text-medium-gray">
            Card details not on file yet.
          </p>
          <p className="mt-0.5 text-xs text-medium-gray">
            Last 4 appear after a completed checkout.
          </p>
        </div>
      )}

      <dl className="mt-3 grid gap-2 border-t border-border-gray pt-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
            Method
          </dt>
          <dd className="mt-0.5 capitalize text-dark-charcoal">
            {payment.method === "—" ? "—" : payment.method}
          </dd>
        </div>
        <div>
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
            Status
          </dt>
          <dd className="mt-0.5 text-dark-charcoal">{statusLabel}</dd>
        </div>
        {payment.reference ? (
          <div className="sm:col-span-2">
            <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              Reference
            </dt>
            <dd
              className="mt-0.5 truncate text-xs tabular-nums text-medium-gray"
              title={payment.reference}
            >
              {payment.reference}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
