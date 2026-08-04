import { NextResponse } from "next/server";
import {
  getAdminBrands,
  getAdminCategories,
  getAdminCustomers,
  getAdminOrders,
  getAdminProducts,
  getAdminQuotes,
} from "@/lib/data/admin";
import { matchesQuery } from "@/lib/search";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type AdminSearchHit = {
  id: string;
  type: "product" | "category" | "brand" | "order" | "customer" | "quote";
  title: string;
  subtitle?: string;
  href: string;
};

const PER_TYPE = 4;

async function requireAdminSearchAccess(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    if (isMasterAdminEmail(user.email)) return true;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, is_owner")
      .eq("id", user.id)
      .maybeSingle();

    return isMasterAdmin(profile);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const allowed = await requireAdminSearchAccess();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (q.length < 1) {
    return NextResponse.json({ results: [] as AdminSearchHit[] });
  }

  const [products, categories, brands, orders, customers, quotes] =
    await Promise.all([
      getAdminProducts({ q, active: "all" }),
      getAdminCategories(),
      getAdminBrands(),
      getAdminOrders({ q }),
      getAdminCustomers({ q }),
      getAdminQuotes({ q }),
    ]);

  const results: AdminSearchHit[] = [];

  for (const product of products.slice(0, PER_TYPE)) {
    results.push({
      id: product.id,
      type: "product",
      title: product.name,
      subtitle: product.sku ? `SKU ${product.sku}` : undefined,
      href: `/admin/products/${product.id}`,
    });
  }

  for (const category of categories
    .filter(
      (c) =>
        matchesQuery(c.name, q) ||
        matchesQuery(c.slug, q) ||
        matchesQuery(c.description, q),
    )
    .slice(0, PER_TYPE)) {
    results.push({
      id: category.id,
      type: "category",
      title: category.name,
      subtitle: category.slug,
      href: `/admin/categories/${category.id}`,
    });
  }

  for (const brand of brands
    .filter(
      (b) =>
        matchesQuery(b.name, q) ||
        matchesQuery(b.slug, q) ||
        matchesQuery(b.description, q),
    )
    .slice(0, PER_TYPE)) {
    results.push({
      id: brand.id,
      type: "brand",
      title: brand.name,
      subtitle: brand.slug,
      href: `/admin/brands/${brand.id}/edit`,
    });
  }

  for (const order of orders.slice(0, PER_TYPE)) {
    results.push({
      id: order.id,
      type: "order",
      title: order.order_number,
      subtitle: order.email,
      href: `/admin/orders/${order.id}`,
    });
  }

  for (const customer of customers.slice(0, PER_TYPE)) {
    const name =
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.email;
    results.push({
      id: customer.id,
      type: "customer",
      title: name,
      subtitle: customer.email,
      href: `/admin/customers/${customer.id}`,
    });
  }

  for (const quote of quotes.slice(0, PER_TYPE)) {
    results.push({
      id: quote.id,
      type: "quote",
      title: quote.quote_number || `Quote ${quote.id.slice(0, 8)}`,
      subtitle: quote.email ?? quote.company ?? undefined,
      href: `/admin/quotes/${quote.id}`,
    });
  }

  return NextResponse.json({ results });
}
