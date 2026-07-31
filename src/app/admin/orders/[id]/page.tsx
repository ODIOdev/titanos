import { notFound } from "next/navigation";
import {
  OrderNotesForm,
  OrderStatusForm,
} from "@/components/admin/admin-forms";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminOrder } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = order.shipping_address as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
          {order.order_number}
        </h2>
        <Badge>{order.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Line items
            </h3>
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

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Status timeline
            </h3>
            <ol className="mt-4 space-y-3">
              {(order.history ?? []).length === 0 ? (
                <li className="text-sm text-medium-gray">No history yet.</li>
              ) : (
                (order.history ?? []).map((h) => (
                  <li key={h.id} className="flex gap-3 border-l-2 border-titan-yellow pl-3">
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

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <OrderNotesForm
              orderId={order.id}
              initialNotes={order.internal_notes ?? ""}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Summary
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-medium-gray">Email</dt>
                <dd>{order.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-medium-gray">Placed</dt>
                <dd>{formatDate(order.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-medium-gray">Subtotal</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-medium-gray">Shipping</dt>
                <dd>{formatCurrency(order.shipping_amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-medium-gray">Tax</dt>
                <dd>{formatCurrency(order.tax_amount)}</dd>
              </div>
              <div className="flex justify-between border-t border-border-gray pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="mb-3 font-heading text-base font-semibold uppercase tracking-wide">
              Update status
            </h3>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Shipping
            </h3>
            {address ? (
              <address className="mt-3 not-italic text-sm text-medium-gray">
                {address.first_name} {address.last_name}
                <br />
                {address.line1}
                <br />
                {address.city}, {address.state} {address.postal_code}
              </address>
            ) : (
              <p className="mt-3 text-sm text-medium-gray">No address on file.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
