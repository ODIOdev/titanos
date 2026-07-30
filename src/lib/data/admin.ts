import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SITE_CONFIG,
} from "@/lib/data/seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Brand,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Profile,
  Quote,
  QuoteStatus,
  Resource,
} from "@/types";

export type AdminMetrics = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  pendingQuotes: number;
  lowStockCount: number;
  aov: number;
  revenueOverTime: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  salesByCategory: { category: string; sales: number }[];
  topProducts: { name: string; sales: number; quantity: number }[];
};

export type AdminOrder = Order & {
  items?: OrderItem[];
  history?: {
    id: string;
    status: string;
    notes: string | null;
    created_at: string;
  }[];
  internal_notes?: string | null;
  notes?: string | null;
};

export type AdminQuoteItem = {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  sort_order: number;
};

export type AdminQuote = Quote & {
  items?: AdminQuoteItem[];
  internal_notes?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  shipping_amount?: number | null;
  tax_amount?: number | null;
  expires_at?: string | null;
  shipping_address?: Record<string, unknown> | null;
  requested_delivery_date?: string | null;
  tax_exempt?: boolean;
  custom_product_description?: string | null;
  converted_order_id?: string | null;
};

export type AdminCustomer = Pick<
  Profile,
  "id" | "email" | "first_name" | "last_name" | "company" | "phone" | "role" | "created_at"
> & {
  orders_count: number;
  total_spent: number;
};

export type SiteSettingsForm = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  phone: string;
  freeShippingThreshold: number;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedToAdminProduct(p: (typeof SEED_PRODUCTS)[number]): Product {
  const { specifications, certifications, features, ...rest } = p;
  const brand = SEED_BRANDS.find((b) => b.id === p.brand_id) ?? null;
  const category = SEED_CATEGORIES.find((c) => c.id === p.category_id) ?? null;
  return {
    ...rest,
    metadata: {
      certifications,
      features,
    },
    brand: brand
      ? {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          logo_url: brand.logo_url,
          active: brand.active,
        }
      : null,
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url,
          parent_id: null,
          sort_order: category.sort_order,
          active: category.active,
        }
      : null,
    images: [
      {
        id: `${p.id}-img`,
        product_id: p.id,
        url: p.image_url,
        alt_text: p.name,
        sort_order: 0,
        is_primary: true,
      },
    ],
    specifications: specifications.map((s, i) => ({
      id: `${p.id}-spec-${i}`,
      product_id: p.id,
      name: s.name,
      value: s.value,
      sort_order: i,
    })),
  };
}

const DEMO_ORDERS: AdminOrder[] = (() => {
  const products = SEED_PRODUCTS.slice(0, 12);
  const statuses: OrderStatus[] = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  return Array.from({ length: 18 }, (_, i) => {
    const p = products[i % products.length]!;
    const qty = (i % 4) + 1;
    const unit = p.price;
    const subtotal = unit * qty;
    const shipping = subtotal > 199 ? 0 : 12.99;
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = subtotal + shipping + tax;
    const status = statuses[i % statuses.length]!;
    const created = daysAgo(17 - i);
    const orderId = `d0000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`;
    return {
      id: orderId,
      order_number: `TSC-DEMO-${String(1000 + i)}`,
      user_id: null,
      email: `buyer${(i % 8) + 1}@example.com`,
      status,
      payment_status: status === "pending" || status === "cancelled" ? "unpaid" : "paid",
      fulfillment_status:
        status === "shipped" || status === "delivered"
          ? "fulfilled"
          : status === "cancelled"
            ? "cancelled"
            : "unfulfilled",
      subtotal,
      shipping_amount: shipping,
      tax_amount: tax,
      discount_amount: 0,
      total,
      currency: "USD",
      shipping_address: {
        first_name: "Jordan",
        last_name: "Lee",
        line1: "1200 Commerce St",
        city: "Dallas",
        state: "TX",
        postal_code: "75201",
        country: "US",
      },
      created_at: created,
      notes: null,
      internal_notes: i % 3 === 0 ? "Customer requested jobsite delivery window." : null,
      items: [
        {
          id: `${orderId}-item-1`,
          order_id: orderId,
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          quantity: qty,
          unit_price: unit,
          total_price: subtotal,
        },
      ],
      history: [
        {
          id: `${orderId}-h1`,
          status: "pending",
          notes: "Order placed",
          created_at: created,
        },
        ...(status !== "pending"
          ? [
              {
                id: `${orderId}-h2`,
                status,
                notes: `Status updated to ${status}`,
                created_at: daysAgo(16 - i),
              },
            ]
          : []),
      ],
    };
  });
})();

const DEMO_QUOTES: AdminQuote[] = (() => {
  const products = SEED_PRODUCTS.slice(0, 10);
  const statuses: QuoteStatus[] = [
    "submitted",
    "reviewing",
    "information_requested",
    "quoted",
    "accepted",
    "rejected",
    "expired",
  ];
  return Array.from({ length: 10 }, (_, i) => {
    const p = products[i % products.length]!;
    const qty = 25 + i * 5;
    const unit = Math.round(p.price * 0.92 * 100) / 100;
    const subtotal = unit * qty;
    const discount = i % 2 === 0 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const shipping = 45;
    const tax = 0;
    const total = subtotal - discount + shipping + tax;
    const status = statuses[i % statuses.length]!;
    const quoteId = `e0000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`;
    return {
      id: quoteId,
      quote_number: `QT-DEMO-${String(2000 + i)}`,
      user_id: null,
      contact_name: ["Alex Rivera", "Sam Chen", "Morgan Blake", "Casey Ortiz"][i % 4]!,
      company: ["Gulf Coast Construction", "Metro Utilities", "Lone Star Roads", "Apex Industrial"][
        i % 4
      ]!,
      email: `quotes${i + 1}@example.com`,
      phone: "713-555-0100",
      industry: ["Construction", "Utilities", "DOT", "Manufacturing"][i % 4]!,
      project_name: `Project ${String.fromCharCode(65 + i)}`,
      status,
      total,
      created_at: daysAgo(20 - i),
      internal_notes: i % 2 === 0 ? "Waiting on volume confirmation." : null,
      notes: "Need bulk pricing and net-30 terms.",
      subtotal,
      discount_amount: discount,
      shipping_amount: shipping,
      tax_amount: tax,
      expires_at: daysAgo(-(14 - i)),
      tax_exempt: i % 3 === 0,
      requested_delivery_date: daysAgo(-(30 + i)),
      shipping_address: {
        line1: "500 Industrial Blvd",
        city: "Houston",
        state: "TX",
        postal_code: "77002",
        country: "US",
      },
      items: [
        {
          id: `${quoteId}-item-1`,
          quote_id: quoteId,
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          quantity: qty,
          unit_price: unit,
          notes: null,
          sort_order: 0,
        },
      ],
      converted_order_id: null,
    };
  });
})();

const DEMO_CUSTOMERS: AdminCustomer[] = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    email: "buyer1@example.com",
    first_name: "Jordan",
    last_name: "Lee",
    company: "Gulf Coast Construction",
    phone: "713-555-0199",
    role: "customer",
    created_at: daysAgo(90),
    orders_count: 5,
    total_spent: 2480.45,
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    email: "buyer2@example.com",
    first_name: "Taylor",
    last_name: "Nguyen",
    company: "Metro Utilities",
    phone: "832-555-0144",
    role: "customer",
    created_at: daysAgo(60),
    orders_count: 3,
    total_spent: 1120.0,
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    email: "buyer3@example.com",
    first_name: "Riley",
    last_name: "Brooks",
    company: "Lone Star Roads",
    phone: "281-555-0177",
    role: "customer",
    created_at: daysAgo(45),
    orders_count: 2,
    total_spent: 689.5,
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    email: "buyer4@example.com",
    first_name: "Avery",
    last_name: "Patel",
    company: "Apex Industrial",
    phone: "346-555-0112",
    role: "customer",
    created_at: daysAgo(30),
    orders_count: 1,
    total_spent: 214.99,
  },
];

const DEMO_RESOURCES: Resource[] = [
  {
    id: "r0000000-0000-4000-8000-000000000001",
    title: "ANSI Hi-Vis Selection Guide",
    slug: "ansi-hi-vis-selection-guide",
    excerpt: "How to choose Class 2 vs Class 3 garments for roadway work.",
    content: null,
    cover_image: null,
    published: true,
    created_at: daysAgo(40),
  },
  {
    id: "r0000000-0000-4000-8000-000000000002",
    title: "Hard Hat Care & Inspection Checklist",
    slug: "hard-hat-care-checklist",
    excerpt: "Daily inspection steps and replacement intervals.",
    content: null,
    cover_image: null,
    published: true,
    created_at: daysAgo(25),
  },
  {
    id: "r0000000-0000-4000-8000-000000000003",
    title: "Traffic Control Setup Basics",
    slug: "traffic-control-setup-basics",
    excerpt: "Cone spacing, sign placement, and night visibility tips.",
    content: null,
    cover_image: null,
    published: false,
    created_at: daysAgo(10),
  },
];

function buildDemoMetrics(): AdminMetrics {
  const paidOrders = DEMO_ORDERS.filter(
    (o) => !["cancelled", "refunded", "pending"].includes(o.status),
  );
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const ordersCount = DEMO_ORDERS.length;
  const aov = paidOrders.length ? revenue / paidOrders.length : 0;
  const lowStockCount = SEED_PRODUCTS.filter(
    (p) => p.inventory_quantity <= p.low_stock_threshold,
  ).length;
  const pendingQuotes = DEMO_QUOTES.filter((q) =>
    ["submitted", "reviewing", "information_requested", "quoted"].includes(q.status),
  ).length;

  const revenueOverTime = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayOrders = DEMO_ORDERS.filter((o) => {
      const od = new Date(o.created_at);
      return (
        od.toDateString() === date.toDateString() &&
        !["cancelled", "refunded"].includes(o.status)
      );
    });
    const dayRevenue =
      dayOrders.reduce((s, o) => s + o.total, 0) ||
      Math.round((revenue / 7) * (0.7 + (i % 3) * 0.2) * 100) / 100;
    return { date: label, revenue: Math.round(dayRevenue * 100) / 100 };
  });

  const statusCounts = new Map<string, number>();
  for (const o of DEMO_ORDERS) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const catSales = new Map<string, number>();
  for (const o of DEMO_ORDERS) {
    for (const item of o.items ?? []) {
      const product = SEED_PRODUCTS.find((p) => p.id === item.product_id);
      const cat = SEED_CATEGORIES.find((c) => c.id === product?.category_id);
      const name = cat?.name ?? "Other";
      catSales.set(name, (catSales.get(name) ?? 0) + item.total_price);
    }
  }
  const salesByCategory = Array.from(catSales.entries())
    .map(([category, sales]) => ({ category, sales: Math.round(sales * 100) / 100 }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 6);

  const productSales = new Map<string, { name: string; sales: number; quantity: number }>();
  for (const o of DEMO_ORDERS) {
    for (const item of o.items ?? []) {
      const key = item.product_name;
      const prev = productSales.get(key) ?? { name: key, sales: 0, quantity: 0 };
      prev.sales += item.total_price;
      prev.quantity += item.quantity;
      productSales.set(key, prev);
    }
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map((p) => ({ ...p, sales: Math.round(p.sales * 100) / 100 }));

  return {
    revenue: Math.round(revenue * 100) / 100,
    ordersCount,
    customersCount: DEMO_CUSTOMERS.length,
    pendingQuotes,
    lowStockCount,
    aov: Math.round(aov * 100) / 100,
    revenueOverTime,
    ordersByStatus,
    salesByCategory,
    topProducts,
  };
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const [{ data: orders }, { count: customersCount }, { data: quotes }, { data: products }] =
        await Promise.all([
          supabase.from("orders").select("id, status, total, created_at"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
          supabase.from("quotes").select("id, status"),
          supabase.from("products").select("id, name, inventory_quantity, low_stock_threshold, category_id"),
        ]);

      if (orders?.length) {
        const paid = orders.filter((o) => !["cancelled", "refunded", "pending"].includes(o.status));
        const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
        const aov = paid.length ? revenue / paid.length : 0;
        const lowStockCount = (products ?? []).filter(
          (p) => p.inventory_quantity <= p.low_stock_threshold,
        ).length;
        const pendingQuotes = (quotes ?? []).filter((q) =>
          ["submitted", "reviewing", "information_requested", "quoted"].includes(q.status),
        ).length;

        const statusCounts = new Map<string, number>();
        for (const o of orders) {
          statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
        }

        const demo = buildDemoMetrics();
        return {
          revenue: Math.round(revenue * 100) / 100,
          ordersCount: orders.length,
          customersCount: customersCount ?? 0,
          pendingQuotes,
          lowStockCount,
          aov: Math.round(aov * 100) / 100,
          revenueOverTime: demo.revenueOverTime,
          ordersByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({
            status,
            count,
          })),
          salesByCategory: demo.salesByCategory,
          topProducts: demo.topProducts,
        };
      }
    } catch {
      // Fall through to demo metrics
    }
  }
  return buildDemoMetrics();
}

export async function getAdminProducts(opts?: {
  q?: string;
  active?: "all" | "active" | "archived";
}): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      let query = supabase
        .from("products")
        .select("*, brand:brands(*), category:categories(*)")
        .order("name");

      if (opts?.active === "active") query = query.eq("active", true);
      if (opts?.active === "archived") query = query.eq("active", false);
      if (opts?.q) {
        query = query.or(
          `name.ilike.%${opts.q}%,sku.ilike.%${opts.q}%,short_description.ilike.%${opts.q}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data?.length) {
        return data.map((row) => {
          const r = row as unknown as Product & {
            price: number | string;
            compare_at_price: number | string | null;
          };
          return {
            ...r,
            price: Number(r.price),
            compare_at_price:
              r.compare_at_price != null ? Number(r.compare_at_price) : null,
          };
        });
      }
    } catch {
      // Fall through
    }
  }

  let products = SEED_PRODUCTS.map(seedToAdminProduct);
  if (opts?.active === "active") products = products.filter((p) => p.active);
  if (opts?.active === "archived") products = products.filter((p) => !p.active);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.short_description?.toLowerCase().includes(q) ?? false),
    );
  }
  return products;
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const products = await getAdminProducts({ active: "all" });
  return products.find((p) => p.id === id) ?? null;
}

export async function getAdminCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      if (data?.length) return data as Category[];
    } catch {
      // Fall through
    }
  }
  return SEED_CATEGORIES.map((c) => ({ ...c, parent_id: null }));
}

export type AdminCategoryProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandName: string;
  price: number;
  inventory: number;
  lowStockThreshold: number;
  unitsSold: number;
  sales: number;
  active: boolean;
};

export type AdminCategoryDetail = {
  category: Category;
  products: AdminCategoryProductRow[];
  brandCount: number;
  brands: { id: string; name: string; productCount: number }[];
  totalInventory: number;
  totalSales: number;
  totalUnitsSold: number;
  productCount: number;
};

export async function getAdminCategoryDetail(
  id: string,
): Promise<AdminCategoryDetail | null> {
  const categories = await getAdminCategories();
  const category = categories.find((c) => c.id === id || c.slug === id) ?? null;
  if (!category) return null;

  const products = await getAdminProducts({ active: "all" });
  const inCategory = products.filter((p) => p.category_id === category.id);

  const salesByProduct = new Map<string, { units: number; sales: number }>();

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const productIds = inCategory.map((p) => p.id);
      if (productIds.length) {
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id, quantity, total_price, order_id")
          .in("product_id", productIds);

        const orderIds = [
          ...new Set((items ?? []).map((i) => i.order_id).filter(Boolean)),
        ];
        const paidStatuses = new Set([
          "paid",
          "processing",
          "shipped",
          "delivered",
        ]);
        let paidOrderIds = new Set<string>();

        if (orderIds.length) {
          const { data: orders } = await supabase
            .from("orders")
            .select("id, status")
            .in("id", orderIds);
          paidOrderIds = new Set(
            (orders ?? [])
              .filter((o) => paidStatuses.has(o.status))
              .map((o) => o.id),
          );
        }

        for (const item of items ?? []) {
          if (!item.product_id || !paidOrderIds.has(item.order_id)) continue;
          const prev = salesByProduct.get(item.product_id) ?? {
            units: 0,
            sales: 0,
          };
          salesByProduct.set(item.product_id, {
            units: prev.units + Number(item.quantity),
            sales: prev.sales + Number(item.total_price),
          });
        }
      }
    } catch {
      // Fall through to seed estimates
    }
  }

  const rows: AdminCategoryProductRow[] = inCategory.map((p) => {
    const fromOrders = salesByProduct.get(p.id);
    const unitsSold =
      fromOrders?.units ??
      Math.max(0, Math.round(Number(p.rating_count) * 1.4));
    const sales =
      fromOrders?.sales ?? Number((unitsSold * Number(p.price)).toFixed(2));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brandName: p.brand?.name ?? "—",
      price: Number(p.price),
      inventory: p.inventory_quantity,
      lowStockThreshold: p.low_stock_threshold,
      unitsSold,
      sales,
      active: p.active,
    };
  });

  const brandMap = new Map<string, { id: string; name: string; productCount: number }>();
  for (const p of inCategory) {
    if (!p.brand) continue;
    const existing = brandMap.get(p.brand.id);
    if (existing) {
      existing.productCount += 1;
    } else {
      brandMap.set(p.brand.id, {
        id: p.brand.id,
        name: p.brand.name,
        productCount: 1,
      });
    }
  }

  const brands = Array.from(brandMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    category,
    products: rows.sort((a, b) => b.sales - a.sales),
    brandCount: brands.length,
    brands,
    totalInventory: rows.reduce((sum, r) => sum + r.inventory, 0),
    totalSales: Number(rows.reduce((sum, r) => sum + r.sales, 0).toFixed(2)),
    totalUnitsSold: rows.reduce((sum, r) => sum + r.unitsSold, 0),
    productCount: rows.length,
  };
}

export async function getAdminBrands(): Promise<Brand[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase.from("brands").select("*").order("name");
      if (data?.length) {
        return data.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          logo_url: b.logo_url,
          active: b.active,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return SEED_BRANDS;
}

export async function getAdminOrders(opts?: { status?: string }): Promise<AdminOrder[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      let query = supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (opts?.status && opts.status !== "all") {
        query = query.eq("status", opts.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data?.length) {
        return (data as unknown as AdminOrder[]).map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          shipping_amount: Number(o.shipping_amount),
          tax_amount: Number(o.tax_amount),
          discount_amount: Number(o.discount_amount),
          total: Number(o.total),
          shipping_address: (o.shipping_address as Record<string, unknown>) ?? null,
        }));
      }
    } catch {
      // Fall through
    }
  }

  let orders = DEMO_ORDERS;
  if (opts?.status && opts.status !== "all") {
    orders = orders.filter((o) => o.status === opts.status);
  }
  return orders;
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, items:order_items(*), history:order_status_history(*)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const row = data as unknown as AdminOrder;
        return {
          ...row,
          subtotal: Number(row.subtotal),
          shipping_amount: Number(row.shipping_amount),
          tax_amount: Number(row.tax_amount),
          discount_amount: Number(row.discount_amount),
          total: Number(row.total),
          shipping_address: (row.shipping_address as Record<string, unknown>) ?? null,
          history: [...(row.history ?? [])].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          ),
        };
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_ORDERS.find((o) => o.id === id) ?? null;
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      if (data?.length) {
        return data.map((p) => ({
          id: p.id,
          email: p.email,
          first_name: p.first_name,
          last_name: p.last_name,
          company: p.company,
          phone: p.phone,
          role: p.role,
          created_at: p.created_at,
          orders_count: 0,
          total_spent: 0,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_CUSTOMERS;
}

export async function getAdminQuotes(opts?: { status?: string }): Promise<AdminQuote[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (opts?.status && opts.status !== "all") {
        query = query.eq("status", opts.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data?.length) {
        return data.map((q) => ({
          ...q,
          total: q.total != null ? Number(q.total) : null,
          shipping_address: (q.shipping_address as Record<string, unknown>) ?? null,
        })) as AdminQuote[];
      }
    } catch {
      // Fall through
    }
  }

  let quotes = DEMO_QUOTES;
  if (opts?.status && opts.status !== "all") {
    quotes = quotes.filter((q) => q.status === opts.status);
  }
  return quotes;
}

export async function getAdminQuote(id: string): Promise<AdminQuote | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("quotes")
        .select("*, items:quote_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const row = data as unknown as AdminQuote;
        return {
          ...row,
          total: row.total != null ? Number(row.total) : null,
          subtotal: row.subtotal != null ? Number(row.subtotal) : null,
          discount_amount:
            row.discount_amount != null ? Number(row.discount_amount) : null,
          shipping_amount:
            row.shipping_amount != null ? Number(row.shipping_amount) : null,
          tax_amount: row.tax_amount != null ? Number(row.tax_amount) : null,
          shipping_address: (row.shipping_address as Record<string, unknown>) ?? null,
          items: [...(row.items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        };
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_QUOTES.find((q) => q.id === id) ?? null;
}

export async function getAdminInventory(): Promise<Product[]> {
  const products = await getAdminProducts({ active: "active" });
  return [...products].sort((a, b) => a.inventory_quantity - b.inventory_quantity);
}

export async function getAdminResources(): Promise<Resource[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (data?.length) {
        return data.map((r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          content: r.content,
          cover_image: r.cover_image,
          published: r.published,
          created_at: r.created_at,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return DEMO_RESOURCES;
}

export async function getSiteSettings(): Promise<SiteSettingsForm> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data?.length) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        const siteConfig = (map.site_config ?? {}) as Record<string, unknown>;
        const freeShip = (map.free_shipping_threshold ?? {}) as Record<string, unknown>;
        return {
          siteName: String(siteConfig.name ?? SITE_CONFIG.name),
          tagline: String(siteConfig.tagline ?? SITE_CONFIG.tagline),
          supportEmail: String(siteConfig.supportEmail ?? SITE_CONFIG.supportEmail),
          phone: String(siteConfig.phone ?? SITE_CONFIG.phone),
          freeShippingThreshold: Number(freeShip.amount ?? 199),
        };
      }
    } catch {
      // Fall through
    }
  }
  return {
    siteName: SITE_CONFIG.name,
    tagline: SITE_CONFIG.tagline,
    supportEmail: SITE_CONFIG.supportEmail,
    phone: SITE_CONFIG.phone,
    freeShippingThreshold: 199,
  };
}
