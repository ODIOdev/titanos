import { notFound } from "next/navigation";
import { QuoteReviewForm } from "@/components/admin/admin-forms";
import { Badge } from "@/components/ui/badge";
import { getAdminQuote } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const quote = await getAdminQuote(id);
  if (!quote) notFound();

  const address = quote.shipping_address as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
          {quote.quote_number}
        </h2>
        <Badge>{quote.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-border-gray bg-white p-5 lg:col-span-2">
          <QuoteReviewForm quote={quote} />
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Request details
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-medium-gray">Contact</dt>
                <dd className="font-medium">{quote.contact_name}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Company</dt>
                <dd>{quote.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">EIN</dt>
                <dd>{quote.ein ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Email</dt>
                <dd>{quote.email}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Phone</dt>
                <dd>{quote.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Industry</dt>
                <dd>{quote.industry ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Project</dt>
                <dd>{quote.project_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Delivery date</dt>
                <dd>
                  {quote.requested_delivery_date
                    ? formatDate(quote.requested_delivery_date)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-medium-gray">Urgency</dt>
                <dd className="capitalize">
                  {quote.urgency?.replaceAll("_", " ") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-medium-gray">Submitted</dt>
                <dd>{formatDate(quote.created_at)}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Expires</dt>
                <dd>
                  {quote.expires_at ? formatDate(quote.expires_at) : "—"}
                </dd>
              </div>
              <div className="border-t border-border-gray pt-2 font-semibold">
                <dt className="text-medium-gray">Quoted total</dt>
                <dd>
                  {quote.total != null ? formatCurrency(quote.total) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Shipping
            </h3>
            {address ? (
              <address className="mt-3 not-italic text-sm text-medium-gray">
                {address.line1}
                <br />
                {address.city}, {address.state} {address.postal_code}
              </address>
            ) : (
              <p className="mt-3 text-sm text-medium-gray">No address.</p>
            )}
          </div>

          {quote.notes ? (
            <div className="rounded-sm border border-border-gray bg-white p-5">
              <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
                Customer notes
              </h3>
              <p className="mt-2 text-sm text-medium-gray">{quote.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
