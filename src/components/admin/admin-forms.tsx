"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  convertQuoteToOrder,
  updateOrderInternalNotes,
  updateOrderStatus,
  updateQuote,
} from "@/lib/actions/admin";
import type { AdminQuote, AdminQuoteItem } from "@/lib/data/admin";
import type { OrderStatus, QuoteStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const QUOTE_STATUSES: QuoteStatus[] = [
  "submitted",
  "reviewing",
  "information_requested",
  "quoted",
  "accepted",
  "rejected",
  "expired",
  "converted",
];

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateOrderStatus(orderId, status as OrderStatus);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          toast.success(result.message);
          router.refresh();
        });
      }}
    >
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={ORDER_STATUSES.map((s) => ({
          label: s.replace(/_/g, " "),
          value: s,
        }))}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}

export function OrderNotesForm({
  orderId,
  initialNotes,
}: {
  orderId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateOrderInternalNotes(orderId, notes);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          toast.success(result.message);
          router.refresh();
        });
      }}
    >
      <Textarea
        label="Internal notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}

export function QuoteReviewForm({ quote }: { quote: AdminQuote }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(quote.status);
  const [internalNotes, setInternalNotes] = useState(quote.internal_notes ?? "");
  const [discountAmount, setDiscountAmount] = useState(
    String(quote.discount_amount ?? 0),
  );
  const [shippingAmount, setShippingAmount] = useState(
    String(quote.shipping_amount ?? 0),
  );
  const [taxAmount, setTaxAmount] = useState(String(quote.tax_amount ?? 0));
  const [expiresAt, setExpiresAt] = useState(
    quote.expires_at ? quote.expires_at.slice(0, 10) : "",
  );
  const [items, setItems] = useState<AdminQuoteItem[]>(quote.items ?? []);

  const updateItem = (index: number, patch: Partial<AdminQuoteItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateQuote(quote.id, {
        status: status as QuoteStatus,
        internalNotes,
        discountAmount: Number(discountAmount) || 0,
        shippingAmount: Number(shippingAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        expiresAt: expiresAt || null,
        items: items.map((item) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          notes: item.notes,
        })),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const convert = () => {
    startTransition(async () => {
      const result = await convertQuoteToOrder(quote.id);
      if (result && !result.success) {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteStatus)}
          options={QUOTE_STATUSES.map((s) => ({
            label: s.replace(/_/g, " "),
            value: s,
          }))}
        />
        <Input
          label="Discount amount"
          type="number"
          step="0.01"
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
        />
        <Input
          label="Shipping amount"
          type="number"
          step="0.01"
          value={shippingAmount}
          onChange={(e) => setShippingAmount(e.target.value)}
        />
        <Input
          label="Tax amount"
          type="number"
          step="0.01"
          value={taxAmount}
          onChange={(e) => setTaxAmount(e.target.value)}
        />
        <Input
          label="Expiration date"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <Textarea
        label="Internal notes"
        rows={4}
        value={internalNotes}
        onChange={(e) => setInternalNotes(e.target.value)}
      />

      <div>
        <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
          Line items
        </h3>
        <div className="mt-3 space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-sm border border-border-gray p-3 sm:grid-cols-4"
            >
              <Input
                label="Product"
                value={item.product_name}
                onChange={(e) => updateItem(index, { product_name: e.target.value })}
              />
              <Input
                label="SKU"
                value={item.sku ?? ""}
                onChange={(e) => updateItem(index, { sku: e.target.value })}
              />
              <Input
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, { quantity: Number(e.target.value) || 0 })
                }
              />
              <Input
                label="Unit price"
                type="number"
                step="0.01"
                value={item.unit_price ?? 0}
                onChange={(e) =>
                  updateItem(index, {
                    unit_price: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save quote"}
        </Button>
        {quote.status !== "converted" && !quote.converted_order_id ? (
          <Button
            type="button"
            variant="secondary"
            onClick={convert}
            disabled={pending}
          >
            Convert to order
          </Button>
        ) : null}
      </div>
    </div>
  );
}
