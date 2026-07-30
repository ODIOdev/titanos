import Link from "next/link";
import { FileText, Heart, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

async function getDashboardStats() {
  const defaults = {
    orders: 0,
    quotes: 0,
    addresses: 0,
    wishlist: 0,
  };

  if (!isSupabaseConfigured()) return defaults;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return defaults;

    const [ordersRes, quotesRes, addressesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["submitted", "reviewing", "information_requested", "quoted"]),
      supabase
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    return {
      orders: ordersRes.count ?? 0,
      quotes: quotesRes.count ?? 0,
      addresses: addressesRes.count ?? 0,
      wishlist: 0,
    };
  } catch {
    return defaults;
  }
}

export default async function AccountDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Total orders",
      value: stats.orders,
      href: "/account/orders",
      icon: Package,
      description: "View order history",
    },
    {
      title: "Open quotes",
      value: stats.quotes,
      href: "/account/quotes",
      icon: FileText,
      description: "Track quote requests",
    },
    {
      title: "Saved addresses",
      value: stats.addresses,
      href: "/account/addresses",
      icon: MapPin,
      description: "Manage shipping addresses",
    },
    {
      title: "Wishlist items",
      value: stats.wishlist,
      href: "/account/wishlist",
      icon: Heart,
      description: "Products you saved",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Overview of your Titan Safety Co. account activity.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <p className="mt-1 text-xs text-medium-gray">{card.description}</p>
                </div>
                <Icon className="size-5 text-medium-gray" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-4xl text-dark-charcoal">{card.value}</p>
                <Link
                  href={card.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "mt-3 -ml-3",
                  )}
                >
                  View
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
          Continue shopping
        </Link>
        <Link href="/quote" className={cn(buttonVariants({ variant: "outline" }))}>
          Request a quote
        </Link>
      </div>
    </div>
  );
}
