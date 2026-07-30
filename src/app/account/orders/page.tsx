import Link from "next/link";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Order } from "@/types";

async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (data ?? []) as Order[];
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Orders
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Track and review your past purchases.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border-gray bg-white">
          <EmptyState
            icon={<Package />}
            title="No orders yet"
            description="When you place an order, it will show up here with tracking and invoice details."
            action={
              <Link href="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
                Browse products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-sm border border-border-gray bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border-gray bg-light-gray/60 text-xs uppercase tracking-wide text-medium-gray">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border-gray last:border-0">
                  <td className="px-4 py-3 font-medium text-dark-charcoal">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-medium-gray">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 capitalize text-dark-charcoal">
                    {order.status.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-dark-charcoal">
                    {formatCurrency(Number(order.total))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
