import { notFound } from "next/navigation";
import { MapPin, Package } from "lucide-react";
import {
  OrderNotesForm,
  OrderStatusForm,
} from "@/components/admin/admin-forms";
import { DataTable } from "@/components/admin/data-table";
import { OrderFulfillmentStepper } from "@/components/admin/order-fulfillment-stepper";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderWorkflowActions } from "@/components/admin/order-workflow-actions";
import { getAdminOrder } from "@/lib/data/admin";
import {
  nextOrderActionLabel,
  orderNeedsAttention,
} from "@/lib/admin/orders-workflow";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

const SHIP_CHECKLIST = [
  { id: "paid", label: "Payment confirmed", match: ["paid", "processing", "shipped", "delivered"] },
  { id: "pick", label: "Picked from stock", match: ["processing", "shipped", "delivered"] },
  { id: "pack", label: "Packed & labeled", match: ["shipped", "delivered"] },
  { id: "transit", label: "Handed to carrier", match: ["shipped", "delivered"] },
  { id: "done", label: "Delivered to customer", match: ["delivered"] },
] as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = order.shipping_address as Record<string, string> | null;
  const nextLabel = nextOrderActionLabel(order.status);
  const attention = orderNeedsAttention(order.status);
  const isReturn =
    order.status === "refunded" || order.status === "cancelled";

  return (
    <div className="space-y-4 @5xl:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-2xl">
              {order.order_number}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-medium-gray">
            {order.email} · {formatDate(order.created_at)}
          </p>
        </div>
        {nextLabel ? (
          <div
            className={cn(
              "w-full rounded-sm border px-3 py-2 text-sm @5xl:w-auto @5xl:max-w-xs",
              attention
                ? "border-titan-yellow bg-titan-yellow/10"
                : "border-border-gray bg-light-gray/50",
            )}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              Suggested next step
            </p>
            <p className="mt-0.5 font-semibold text-dark-charcoal">{nextLabel}</p>
          </div>
        ) : null}
      </div>

      <OrderFulfillmentStepper status={order.status} />

      <div className="grid gap-4 @5xl:grid-cols-3">
        <div className="space-y-4 @5xl:col-span-2">
          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-medium-gray" aria-hidden="true" />
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
                Line items
              </h3>
            </div>
            <div className="mt-3">
              <DataTable
                columns={[
                  { key: "product", header: "Product" },
                  { key: "sku", header: "SKU" },
                  { key: "qty", header: "Qty" },
                  { key: "unit", header: "Unit" },
                  { key: "total", header: "Total" },
                ]}
                rows={(order.items ?? []).map((item) => [
                  item.product_name,
                  item.sku,
                  String(item.quantity),
                  formatCurrency(item.unit_price),
                  formatCurrency(item.total_price),
                ])}
                emptyMessage="No line items."
              />
            </div>
          </div>

          {/* Shipping checklist + address */}
          <div className="grid gap-4 @3xl:grid-cols-2">
            <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
                Shipping checklist
              </h3>
              <ul className="mt-3 space-y-2">
                {SHIP_CHECKLIST.map((step) => {
                  const done =
                    !isReturn &&
                    (step.match as readonly string[]).includes(order.status);
                  return (
                    <li
                      key={step.id}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                          done
                            ? "bg-emerald-500 text-white"
                            : "border border-border-gray bg-light-gray text-medium-gray",
                        )}
                        aria-hidden="true"
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span
                        className={
                          done ? "text-dark-charcoal" : "text-medium-gray"
                        }
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {isReturn ? (
                <p className="mt-3 rounded-sm bg-red-50 px-2.5 py-2 text-xs text-red-800">
                  {order.status === "refunded"
                    ? "Return / refund path — fulfillment checklist paused."
                    : "Cancelled — do not ship."}
                </p>
              ) : null}
            </div>

            <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-medium-gray" aria-hidden="true" />
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
                  Ship to
                </h3>
              </div>
              {address ? (
                <address className="mt-3 not-italic text-sm leading-relaxed text-dark-charcoal">
                  <span className="font-medium">
                    {address.first_name} {address.last_name}
                  </span>
                  {address.company ? (
                    <>
                      <br />
                      {address.company}
                    </>
                  ) : null}
                  <br />
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {address.city}, {address.state} {address.postal_code}
                  {address.country ? (
                    <>
                      <br />
                      {address.country}
                    </>
                  ) : null}
                </address>
              ) : (
                <p className="mt-3 text-sm text-medium-gray">No address on file.</p>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
              Status timeline
            </h3>
            <ol className="mt-4 space-y-3">
              {(order.history ?? []).length === 0 ? (
                <li className="text-sm text-medium-gray">No history yet.</li>
              ) : (
                (order.history ?? []).map((h) => (
                  <li
                    key={h.id}
                    className="flex gap-3 border-l-2 border-titan-yellow pl-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{h.status}</p>
                      <p className="text-xs text-medium-gray">
                        {formatDate(h.created_at)}
                        {h.notes ? ` · ${h.notes}` : ""}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ol>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <OrderNotesForm
              orderId={order.id}
              initialNotes={order.internal_notes ?? ""}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={cn(
              "rounded-sm border bg-white p-4 @5xl:p-5",
              attention
                ? "border-titan-yellow"
                : "border-border-gray",
            )}
          >
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
              Process order
            </h3>
            <p className="mt-1 text-xs text-medium-gray">
              One-tap advance through the floor workflow.
            </p>
            <OrderWorkflowActions
              orderId={order.id}
              currentStatus={order.status}
              className="mt-4"
            />
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
              Summary
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-medium-gray">Email</dt>
                <dd className="truncate text-right">{order.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-medium-gray">Placed</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
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
              <div className="flex justify-between gap-3 border-t border-border-gray pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
              Manual status
            </h3>
            <p className="mb-3 text-xs text-medium-gray">
              Jump to any status when the happy path doesn’t fit.
            </p>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
