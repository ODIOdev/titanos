import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliatePromoCard } from "@/components/admin/affiliate-promo-card";
import { CustomerDetailActions } from "@/components/admin/customer-detail-actions";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getAdminCustomer } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const displayName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email;

  const initials = [customer.first_name, customer.last_name]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
            {displayName}
          </h2>
          <Badge>Customer</Badge>
        </div>
        <CustomerDetailActions
          customerId={customer.id}
          customerName={displayName}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-light-gray">
                {customer.avatar_url ? (
                  <Image
                    src={customer.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="font-heading text-lg font-semibold uppercase text-dark-charcoal">
                    {initials || "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
                  {displayName}
                </p>
                <p className="truncate text-sm text-medium-gray">
                  {customer.email}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-medium-gray">Company</dt>
                <dd className="font-medium">{customer.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Phone</dt>
                <dd>{customer.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Location</dt>
                <dd>
                  {[customer.state, customer.postal_code]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-medium-gray">Joined</dt>
                <dd>{formatDate(customer.created_at)}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Password</dt>
                <dd className="font-mono tracking-widest">••••••••</dd>
                <p className="mt-1 text-xs text-medium-gray">
                  Current password cannot be shown (encrypted). Open the key
                  icon → set a new password → it will display for you to copy.
                </p>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-border-gray bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-medium-gray">
                Orders
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
                {customer.orders_count}
              </p>
            </div>
            <div className="rounded-sm border border-border-gray bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-medium-gray">
                Spent
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
                {formatCurrency(customer.total_spent)}
              </p>
            </div>
            <div className="col-span-2 rounded-sm border border-border-gray bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-medium-gray">
                Quotes
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
                {customer.quotes_count}
              </p>
            </div>
          </div>

          <AffiliatePromoCard
            promoCode={customer.promo_code}
            discountPercent={customer.affiliate_discount_percent}
            couponActive={customer.affiliate_coupon_active}
            ordersCount={customer.orders_count}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Orders
            </h3>
            <div className="mt-3">
              <DataTable
                columns={[
                  { key: "order", header: "Order" },
                  { key: "status", header: "Status" },
                  { key: "total", header: "Total" },
                  { key: "date", header: "Date" },
                ]}
                emptyMessage="No orders yet."
                rows={customer.orders.map((order) => [
                  <Link
                    key={`${order.id}-num`}
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
                  >
                    {order.order_number}
                  </Link>,
                  <Badge key={`${order.id}-status`} className="capitalize">
                    {order.status}
                  </Badge>,
                  <span
                    key={`${order.id}-total`}
                    className="font-semibold tabular-nums"
                  >
                    {formatCurrency(order.total)}
                  </span>,
                  <span key={`${order.id}-date`}>
                    {formatDate(order.created_at)}
                  </span>,
                ])}
                footer={
                  customer.orders.length > 0
                    ? [
                        <span key="ft-label" className="uppercase tracking-wide">
                          Grand total
                        </span>,
                        <span key="ft-status" className="text-medium-gray">
                          {customer.orders_count} counted
                        </span>,
                        <span key="ft-total" className="tabular-nums">
                          {formatCurrency(customer.total_spent)}
                        </span>,
                        <span key="ft-date" />,
                      ]
                    : null
                }
              />
            </div>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Quotes
            </h3>
            <div className="mt-3">
              <DataTable
                columns={[
                  { key: "quote", header: "Quote" },
                  { key: "project", header: "Project" },
                  { key: "status", header: "Status" },
                  { key: "date", header: "Date" },
                ]}
                emptyMessage="No quotes yet."
                rows={customer.quotes.map((quote) => [
                  <Link
                    key={`${quote.id}-num`}
                    href={`/admin/quotes/${quote.id}`}
                    className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
                  >
                    {quote.quote_number}
                  </Link>,
                  <span key={`${quote.id}-project`}>
                    {quote.project_name ?? "—"}
                  </span>,
                  <Badge key={`${quote.id}-status`} className="capitalize">
                    {quote.status.replace(/_/g, " ")}
                  </Badge>,
                  <span key={`${quote.id}-date`}>
                    {formatDate(quote.created_at)}
                  </span>,
                ])}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
