import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

type OrderDetail = Order & { items?: OrderItem[] };

async function getOrder(id: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as OrderDetail;
  } catch {
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <Link
          href="/account/orders"
          className="text-sm text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
        >
          ← Back to orders
        </Link>
        <div className="mt-6 rounded-sm border border-border-gray bg-white">
          <EmptyState
            icon={<Package />}
            title="Order unavailable"
            description="Connect Supabase to load live order details. Demo mode has no order records."
            action={
              <Link href="/account/orders" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to orders
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const order = await getOrder(id);
  if (!order) notFound();

  const shipping = order.shipping_address as Record<string, string> | null;

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-sm text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
      >
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
            {order.order_number}
          </h1>
          <p className="mt-2 text-sm text-medium-gray">
            Placed {formatDate(order.created_at)} ·{" "}
            <span className="capitalize">{order.status.replace(/_/g, " ")}</span>
          </p>
        </div>
        <p className="font-heading text-2xl text-dark-charcoal">
          {formatCurrency(Number(order.total))}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(order.items ?? []).length === 0 ? (
              <p className="text-sm text-medium-gray">No line items found.</p>
            ) : (
              (order.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-b border-border-gray pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-dark-charcoal">{item.product_name}</p>
                    <p className="text-xs text-medium-gray">SKU: {item.sku}</p>
                    <p className="mt-1 text-sm text-medium-gray">Qty {item.quantity}</p>
                  </div>
                  <p className="font-medium text-dark-charcoal">
                    {formatCurrency(Number(item.total_price))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-medium-gray">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-medium-gray">Shipping</span>
                <span>{formatCurrency(Number(order.shipping_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-medium-gray">Tax</span>
                <span>{formatCurrency(Number(order.tax_amount))}</span>
              </div>
              {Number(order.discount_amount) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-medium-gray">Discount</span>
                  <span>-{formatCurrency(Number(order.discount_amount))}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border-gray pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-medium-gray">
              {shipping ? (
                <address className="not-italic">
                  {shipping.line1 ?? shipping.address1}
                  <br />
                  {shipping.line2 ? (
                    <>
                      {shipping.line2}
                      <br />
                    </>
                  ) : null}
                  {[shipping.city, shipping.state, shipping.postal_code ?? shipping.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </address>
              ) : (
                <p>No shipping address on file.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
