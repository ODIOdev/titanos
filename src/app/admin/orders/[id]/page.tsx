import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import {
  OrderNotesForm,
  OrderStatusForm,
} from "@/components/admin/admin-forms";
import type { AdminProductPreview } from "@/components/admin/admin-product-preview-dialog";
import { OrderFulfillmentStepper } from "@/components/admin/order-fulfillment-stepper";
import { OrderLineItemsTable } from "@/components/admin/order-line-items-table";
import {
  getOrderPaymentSummary,
  OrderPaymentCard,
} from "@/components/admin/order-payment-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderShipToCard } from "@/components/admin/order-ship-to-card";
import { OrderShippingLabelPanel } from "@/components/admin/order-shipping-label-panel";
import { OrderWorkflowActions } from "@/components/admin/order-workflow-actions";
import { getAdminOrder, getAdminProduct } from "@/lib/data/admin";
import {
  nextOrderActionLabel,
  orderNeedsAttention,
} from "@/lib/admin/orders-workflow";
import {
  formatProductStockBySize,
  getProductStockBySize,
  getProductStockQuantity,
} from "@/lib/catalog/product-stock";
import { cn, formatCurrency, formatDate, getCatalogStatus } from "@/lib/utils";

/** Border + surface for the suggested-next chip, keyed to pipeline stage tones. */
const STAGE_NEXT_STEP_CHROME: Record<string, string> = {
  pending: "border-orange-200 bg-orange-50",
  paid: "border-emerald-200 bg-emerald-50",
  processing: "border-blue-200 bg-blue-50",
  shipped: "border-sky-200 bg-sky-50",
  delivered: "border-teal-200 bg-teal-50",
  cancelled: "border-zinc-200 bg-zinc-100",
  refunded: "border-red-200 bg-red-50",
};

const STAGE_NEXT_STEP_LABEL: Record<string, string> = {
  pending: "text-orange-800/70",
  paid: "text-emerald-800/70",
  processing: "text-blue-800/70",
  shipped: "text-sky-800/70",
  delivered: "text-teal-900/70",
  cancelled: "text-zinc-600",
  refunded: "text-red-800/70",
};

const STAGE_NEXT_STEP_TITLE: Record<string, string> = {
  pending: "text-orange-950",
  paid: "text-emerald-950",
  processing: "text-blue-950",
  shipped: "text-sky-950",
  delivered: "text-teal-950",
  cancelled: "text-zinc-800",
  refunded: "text-red-950",
};

type Params = Promise<{ id: string }>;

const FALLBACK_IMAGE = "/images/products/titan-premium-vented-hard-hat.svg";

const SHIP_CHECKLIST = [
  { id: "paid", label: "Order confirmed", match: ["paid", "processing", "shipped", "delivered"] },
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

  const productIds = [
    ...new Set(
      (order.items ?? [])
        .map((item) => item.product_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const products = await Promise.all(
    productIds.map((productId) => getAdminProduct(productId)),
  );
  const previews: Record<string, AdminProductPreview> = {};
  for (const product of products) {
    if (!product) continue;
    const catalogStatus = getCatalogStatus(product);
    const imageUrl =
      product.image_url ??
      product.images?.find((img) => img.is_primary)?.url ??
      product.images?.[0]?.url ??
      FALLBACK_IMAGE;
    previews[product.id] = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl,
      brandName: product.brand?.name ?? null,
      categoryName: product.category?.name ?? null,
      price: Number(product.price ?? 0),
      inventoryQuantity: getProductStockQuantity(product),
      lowStockThreshold: product.low_stock_threshold ?? 0,
      stockBySize: formatProductStockBySize(product),
      stockSizes: getProductStockBySize(product),
      statusLabel:
        catalogStatus === "active"
          ? "Active"
          : catalogStatus === "draft"
            ? "Draft"
            : "Archived",
      statusVariant:
        catalogStatus === "active"
          ? "success"
          : catalogStatus === "draft"
            ? "warning"
            : "default",
      shortDescription: product.short_description,
      editHref: `/admin/products/${product.id}`,
      showReplenish: catalogStatus !== "archived",
    };
  }

  const address = order.shipping_address as Record<string, string> | null;
  const nextLabel = nextOrderActionLabel(order.status);
  const attention = orderNeedsAttention(order.status);
  const isReturn =
    order.status === "refunded" || order.status === "cancelled";
  /** Match the status-bar / pipeline tone for the order’s current stage. */
  const stageToneKey = order.status;
  const itemCount = (order.items ?? []).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );
  const shipTo = address
    ? {
        firstName: address.first_name,
        lastName: address.last_name,
        company: address.company,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        phone: address.phone,
      }
    : null;
  /** Label desk sits in the right rail — only during the Shipped stage. */
  const showSidebarLabelDesk = !isReturn && order.status === "shipped";

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
              STAGE_NEXT_STEP_CHROME[stageToneKey] ??
                (attention
                  ? "border-titan-yellow bg-titan-yellow/10"
                  : "border-border-gray bg-light-gray/50"),
            )}
          >
            <p
              className={cn(
                "text-[0.65rem] font-semibold uppercase tracking-wide",
                STAGE_NEXT_STEP_LABEL[stageToneKey] ?? "text-medium-gray",
              )}
            >
              Suggested next step
            </p>
            <p
              className={cn(
                "mt-0.5 font-semibold",
                STAGE_NEXT_STEP_TITLE[stageToneKey] ?? "text-dark-charcoal",
              )}
            >
              {nextLabel}
            </p>
          </div>
        ) : null}
      </div>

      <OrderFulfillmentStepper orderId={order.id} status={order.status} />

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
              <OrderLineItemsTable
                items={(order.items ?? []).map((item) => ({
                  id: item.id,
                  productId: item.product_id,
                  productName: item.product_name,
                  sku: item.sku,
                  quantity: item.quantity,
                  unitPrice: Number(item.unit_price),
                  totalPrice: Number(item.total_price),
                }))}
                previews={previews}
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

              <div className="mt-4 border-t border-border-gray pt-4">
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                  Status timeline
                </h4>
                <ol className="mt-3 space-y-3">
                  {(order.history ?? []).length === 0 ? (
                    <li className="text-sm text-medium-gray">No history yet.</li>
                  ) : (
                    (order.history ?? []).map((h) => (
                      <li
                        key={h.id}
                        className="flex gap-3 border-l-2 border-titan-yellow pl-3"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {h.status}
                          </p>
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
            </div>

            <div className="space-y-4">
              <OrderShipToCard orderId={order.id} address={address} />
              <OrderPaymentCard payment={getOrderPaymentSummary(order)} />
            </div>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <OrderNotesForm
              orderId={order.id}
              initialNotes={order.internal_notes ?? ""}
            />
          </div>
        </div>

        <div className="space-y-4">
          {showSidebarLabelDesk ? (
            <OrderShippingLabelPanel
              orderId={order.id}
              orderNumber={order.order_number}
              itemCount={itemCount}
              shipTo={shipTo}
              orderLines={(order.items ?? []).map((item) => ({
                productId: item.product_id,
                quantity: item.quantity || 1,
              }))}
            />
          ) : null}

          <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
              Summary
            </h3>
            {(() => {
              const billing =
                order.billing_address &&
                typeof order.billing_address === "object"
                  ? order.billing_address
                  : null;
              const labelMeta =
                billing &&
                typeof billing.shipping_label === "object" &&
                billing.shipping_label &&
                !Array.isArray(billing.shipping_label)
                  ? (billing.shipping_label as Record<string, unknown>)
                  : null;
              const carrierCost = Number(labelMeta?.carrier_cost ?? 0);
              const feeAmount = Number(labelMeta?.fee_amount ?? 0);
              const feePercent = Number(labelMeta?.fee_percent ?? 12);
              const charged = Number(labelMeta?.charged ?? 0);
              /** Rate selected or label purchased — not checkout flat shipping alone. */
              const hasSelectedShipping =
                carrierCost > 0 || charged > 0 || feeAmount > 0;
              const shippingDisplay = hasSelectedShipping
                ? Number(order.shipping_amount) || charged || 0
                : null;
              const displayTotal = hasSelectedShipping
                ? Number(order.total)
                : Math.max(
                    0,
                    Number(order.subtotal) +
                      Number(order.tax_amount) -
                      Number(order.discount_amount),
                  );

              return (
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
                    <dd className="tabular-nums">
                      {formatCurrency(order.subtotal)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-medium-gray">Shipping</dt>
                      <dd
                        className={cn(
                          "tabular-nums",
                          shippingDisplay == null && "text-medium-gray",
                        )}
                      >
                        {shippingDisplay != null
                          ? formatCurrency(shippingDisplay)
                          : "—"}
                      </dd>
                    </div>
                    {hasSelectedShipping && carrierCost > 0 ? (
                      <p className="text-right text-[0.65rem] text-medium-gray">
                        Label {formatCurrency(carrierCost)} + {feePercent}% fee{" "}
                        {formatCurrency(feeAmount)}
                      </p>
                    ) : !hasSelectedShipping ? (
                      <p className="text-right text-[0.65rem] text-medium-gray">
                        Set when a shipping rate is selected
                      </p>
                    ) : null}
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
                    <dd className="tabular-nums">
                      {formatCurrency(displayTotal)}
                    </dd>
                  </div>
                </dl>
              );
            })()}
          </div>

          <div
            className={cn(
              "rounded-sm border bg-white p-4 @5xl:p-5",
              attention ? "border-titan-yellow" : "border-border-gray",
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
              labelDeskVisible={showSidebarLabelDesk}
              className="mt-4"
            />
          </div>

          {order.status === "delivered" ? (
            <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
              <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
                Manual status
              </h3>
              <p className="mb-3 text-xs text-medium-gray">
                Jump to any status when the happy path doesn’t fit.
              </p>
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
