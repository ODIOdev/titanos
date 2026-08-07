"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import {
  getOrderPaymentSummary,
} from "@/components/admin/order-payment-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { AdminOrder } from "@/lib/data/admin";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
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

function readAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const str = (...keys: string[]) => {
    for (const key of keys) {
      const v = row[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  return {
    firstName: str("first_name", "firstName"),
    lastName: str("last_name", "lastName"),
    company: str("company"),
    line1: str("line1", "address1"),
    line2: str("line2", "address2"),
    city: str("city"),
    state: str("state"),
    postalCode: str("postal_code", "postalCode", "zip"),
    country: str("country") || "US",
    phone: str("phone"),
  };
}

function readShippingLabel(billing: unknown) {
  if (!billing || typeof billing !== "object" || Array.isArray(billing)) {
    return null;
  }
  const label = (billing as Record<string, unknown>).shipping_label;
  if (!label || typeof label !== "object" || Array.isArray(label)) return null;
  const row = label as Record<string, unknown>;
  const num = (key: string) => {
    const v = Number(row[key]);
    return Number.isFinite(v) ? v : null;
  };
  const str = (key: string) =>
    typeof row[key] === "string" && row[key].trim()
      ? (row[key] as string).trim()
      : null;
  return {
    carrierCost: num("carrier_cost"),
    feeAmount: num("fee_amount"),
    feePercent: num("fee_percent"),
    charged: num("charged"),
    carrierCode: str("carrier_code"),
    serviceCode: str("service_code"),
    trackingNumber: str("tracking_number"),
    labelId: str("label_id"),
  };
}

export function AdminOrderPreviewDialog({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!order) return null;

  const items = order.items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipTo = readAddress(order.shipping_address);
  const payment = getOrderPaymentSummary(order);
  const label = readShippingLabel(order.billing_address);
  const shipName = [shipTo?.firstName, shipTo?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={order.order_number}
      description={`${order.email} · ${formatDateTime(order.created_at)}`}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="inline-flex items-center gap-1 text-xs text-medium-gray">
            <Package className="size-3.5" aria-hidden="true" />
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span className="text-xs tabular-nums text-medium-gray">
            Placed {formatDate(order.created_at)}
          </span>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Customer">{order.email}</Detail>
          <Detail label="Payment">
            <span className="capitalize">{payment.status}</span>
            {payment.last4 ? (
              <span className="text-medium-gray">
                {" "}
                · {(payment.brand ?? "card").toString()} ····{payment.last4}
              </span>
            ) : null}
          </Detail>
        </dl>

        <div className="rounded-sm border border-border-gray bg-light-gray/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
            <MapPin className="size-3.5" aria-hidden="true" />
            Ship to
          </div>
          {shipTo?.line1 ? (
            <div className="mt-1.5 space-y-0.5 text-sm text-dark-charcoal">
              {shipName ? <p className="font-medium">{shipName}</p> : null}
              {shipTo.company ? (
                <p className="text-medium-gray">{shipTo.company}</p>
              ) : null}
              <p>{shipTo.line1}</p>
              {shipTo.line2 ? <p>{shipTo.line2}</p> : null}
              <p>
                {[shipTo.city, shipTo.state].filter(Boolean).join(", ")}{" "}
                {shipTo.postalCode}
              </p>
              {shipTo.phone ? (
                <p className="text-medium-gray">{shipTo.phone}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-medium-gray">No ship-to on file.</p>
          )}
        </div>

        {label?.trackingNumber || label?.carrierCode ? (
          <div className="rounded-sm border border-border-gray p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
              Shipping label
            </p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {label.trackingNumber ? (
                <Detail label="Tracking">{label.trackingNumber}</Detail>
              ) : null}
              {label.carrierCode || label.serviceCode ? (
                <Detail label="Service">
                  {[label.carrierCode, label.serviceCode]
                    .filter(Boolean)
                    .join(" / ")}
                </Detail>
              ) : null}
              {label.charged != null ? (
                <Detail label="Shipping charged">
                  {formatCurrency(label.charged)}
                  {label.carrierCost != null ? (
                    <span className="text-xs text-medium-gray">
                      {" "}
                      (label {formatCurrency(label.carrierCost)}
                      {label.feePercent != null
                        ? ` + ${label.feePercent}%`
                        : ""}
                      )
                    </span>
                  ) : null}
                </Detail>
              ) : null}
            </dl>
          </div>
        ) : null}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
            Line items
          </p>
          <ul className="mt-2 divide-y divide-border-gray rounded-sm border border-border-gray">
            {items.length === 0 ? (
              <li className="px-3 py-3 text-sm text-medium-gray">No items.</li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dark-charcoal">
                      {item.product_name}
                    </p>
                    <p className="truncate text-xs text-medium-gray">
                      {[item.sku, `Qty ${item.quantity}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(item.total_price)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <dl className="space-y-1.5 rounded-sm border border-border-gray bg-white px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-medium-gray">Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-medium-gray">Shipping</dt>
            <dd className="tabular-nums">
              {formatCurrency(order.shipping_amount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-medium-gray">Tax</dt>
            <dd className="tabular-nums">
              {formatCurrency(order.tax_amount)}
            </dd>
          </div>
          {Number(order.discount_amount) > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-medium-gray">Discount</dt>
              <dd className="tabular-nums">
                −{formatCurrency(order.discount_amount)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-t border-border-gray pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
          </div>
        </dl>

        {(order.internal_notes || order.notes) && (
          <Detail label="Notes">
            <p className="whitespace-pre-wrap text-sm text-medium-gray">
              {order.internal_notes || order.notes}
            </p>
          </Detail>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-gray pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex h-8 items-center justify-center rounded-sm bg-titan-yellow px-3 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-[#e0b400]"
          >
            Open full order
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
