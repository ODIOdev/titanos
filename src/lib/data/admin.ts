import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SITE_CONFIG,
} from "@/lib/data/seed-data";
import {
  DEPARTMENT_OPTIONS,
  DEFAULT_PRIMARY_DEPARTMENTS,
  PRODUCT_TAG_OPTIONS,
  SHOE_SIZE_OPTIONS,
  SIZE_OPTIONS,
  departmentForProductType,
  mergeCatalogOptions,
  sortCatalogSizes,
  toDepartmentOption,
  type CatalogOption,
  type DepartmentOption,
} from "@/lib/data/catalog-options";
import { productMatchesQuery, productSearchScore, matchesQuery } from "@/lib/search";
import { AFFILIATE_ELIGIBILITY_ORDERS } from "@/lib/affiliates/program";
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
  urgency?: string | null;
  ein?: string | null;
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
  avatar_url?: string | null;
  state?: string | null;
  postal_code?: string | null;
  promo_code?: string | null;
};

export type AdminCustomerDetail = AdminCustomer & {
  avatar_url: string | null;
  state: string | null;
  postal_code: string | null;
  updated_at: string | null;
  promo_code: string | null;
  affiliate_discount_percent: number | null;
  affiliate_coupon_active: boolean | null;
  orders: AdminOrder[];
  quotes: AdminQuote[];
  quotes_count: number;
};

export type AdminMember = Pick<
  Profile,
  "id" | "email" | "first_name" | "last_name" | "company" | "phone" | "role" | "created_at"
> & {
  is_owner: boolean;
  avatar_url: string | null;
  date_of_birth: string | null;
  promo_code: string | null;
};

/** Default affiliate promo discount applied to each role's code. */
export type PromoDiscountSettings = {
  customerPercent: number;
  adminPercent: number;
};

export const DEFAULT_PROMO_DISCOUNTS: PromoDiscountSettings = {
  customerPercent: 10,
  adminPercent: 15,
};

export { AFFILIATE_ELIGIBILITY_ORDERS };

export type SiteSettingsForm = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  phone: string;
  freeShippingThreshold: number;
};

export type AdminTag = {
  name: string;
  productCount: number;
  /** Canonical catalog option, custom (site_settings), or only found on products. */
  source: "catalog" | "custom" | "product";
};

export type AdminDepartment = {
  name: string;
  slug: string;
  productCount: number;
  /**
   * Catalog = live shop primary, custom = admin-defined live,
   * offline = admin-only (hidden from storefront), product = inferred only.
   */
  source: "catalog" | "custom" | "offline" | "product";
};

/** In-memory custom tags for demo mode (no Supabase). */
let demoCatalogTags: string[] = [];
/** Admin-created catalog-source tags in demo mode. */
let demoPrimaryCatalogTags: string[] = [];
/** Built-in / custom tags removed from the catalog in demo mode. */
let demoRemovedCatalogTags: string[] = [];

export function getDemoCatalogTags(): string[] {
  return [...demoCatalogTags];
}

export function setDemoCatalogTags(tags: string[]) {
  demoCatalogTags = [...tags];
}

export function getDemoPrimaryCatalogTags(): string[] {
  return [...demoPrimaryCatalogTags];
}

export function setDemoPrimaryCatalogTags(tags: string[]) {
  demoPrimaryCatalogTags = [...tags];
}

export function getDemoRemovedCatalogTags(): string[] {
  return [...demoRemovedCatalogTags];
}

export function setDemoRemovedCatalogTags(tags: string[]) {
  demoRemovedCatalogTags = [...tags];
}

/** In-memory custom sizes for demo mode (no Supabase). */
let demoCatalogSizes: string[] = [];

export function getDemoCatalogSizes(): string[] {
  return [...demoCatalogSizes];
}

export function setDemoCatalogSizes(sizes: string[]) {
  demoCatalogSizes = [...sizes];
}

/** In-memory custom departments for demo mode (no Supabase). */
let demoCatalogDepartments: string[] = [];
/** Admin-created catalog-source departments in demo mode. */
let demoPrimaryCatalogDepartments: string[] = [...DEFAULT_PRIMARY_DEPARTMENTS];
/** Departments hidden from the live shop in demo mode. */
let demoOfflineCatalogDepartments: string[] = [];
/** Built-in / custom departments removed from the catalog in demo mode. */
let demoRemovedCatalogDepartments: string[] = [];

export function getDemoCatalogDepartments(): string[] {
  return [...demoCatalogDepartments];
}

export function setDemoCatalogDepartments(departments: string[]) {
  demoCatalogDepartments = [...departments];
}

export function getDemoPrimaryCatalogDepartments(): string[] {
  return [...demoPrimaryCatalogDepartments];
}

export function setDemoPrimaryCatalogDepartments(departments: string[]) {
  demoPrimaryCatalogDepartments = [...departments];
}

export function getDemoOfflineCatalogDepartments(): string[] {
  return [...demoOfflineCatalogDepartments];
}

export function setDemoOfflineCatalogDepartments(departments: string[]) {
  demoOfflineCatalogDepartments = [...departments];
}

export function getDemoRemovedCatalogDepartments(): string[] {
  return [...demoRemovedCatalogDepartments];
}

export function setDemoRemovedCatalogDepartments(departments: string[]) {
  demoRemovedCatalogDepartments = [...departments];
}

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
    department: departmentForProductType(p.product_type),
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
    promo_code: "JORDAN-0001",
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
    promo_code: "TAYLOR-0002",
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
    promo_code: "RILEY-0003",
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
    promo_code: "AVERY-0004",
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

function emptyRevenueOverTime(): { date: string; revenue: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
    };
  });
}

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
      // Service role so empty post-reset state is read accurately (no RLS gaps).
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();

      const [
        { data: orders, error: ordersError },
        { count: customersCount, error: customersError },
        { data: quotes, error: quotesError },
        { data: products, error: productsError },
      ] = await Promise.all([
        supabase.from("orders").select("id, status, total, created_at"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer"),
        supabase.from("quotes").select("id, status"),
        supabase
          .from("products")
          .select("id, name, inventory_quantity, low_stock_threshold, category_id"),
      ]);

      if (ordersError) throw ordersError;
      if (customersError) throw customersError;
      if (quotesError) throw quotesError;
      if (productsError) throw productsError;

      const orderRows = orders ?? [];
      const productRows = products ?? [];
      const quoteRows = quotes ?? [];

      const paid = orderRows.filter(
        (o) => !["cancelled", "refunded", "pending"].includes(o.status),
      );
      const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
      const aov = paid.length ? revenue / paid.length : 0;
      const lowStockCount = productRows.filter(
        (p) => p.inventory_quantity <= p.low_stock_threshold,
      ).length;
      const pendingQuotes = quoteRows.filter((q) =>
        ["submitted", "reviewing", "information_requested", "quoted"].includes(
          q.status,
        ),
      ).length;

      const statusCounts = new Map<string, number>();
      for (const o of orderRows) {
        statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
      }

      const revenueOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dayRevenue = orderRows
          .filter((o) => {
            const od = new Date(o.created_at);
            return (
              od.toDateString() === date.toDateString() &&
              !["cancelled", "refunded"].includes(o.status)
            );
          })
          .reduce((s, o) => s + Number(o.total), 0);
        return { date: label, revenue: Math.round(dayRevenue * 100) / 100 };
      });

      let salesByCategory: AdminMetrics["salesByCategory"] = [];
      let topProducts: AdminMetrics["topProducts"] = [];

      if (orderRows.length > 0) {
        const orderIds = orderRows.map((o) => o.id);
        const [{ data: items }, { data: categories }] = await Promise.all([
          supabase
            .from("order_items")
            .select("product_id, product_name, quantity, total_price, order_id")
            .in("order_id", orderIds),
          supabase.from("categories").select("id, name"),
        ]);

        const categoryNameById = new Map(
          (categories ?? []).map((c) => [c.id, c.name]),
        );
        const productCategoryById = new Map(
          productRows.map((p) => [p.id, p.category_id]),
        );

        const catSales = new Map<string, number>();
        const productSales = new Map<
          string,
          { name: string; sales: number; quantity: number }
        >();

        for (const item of items ?? []) {
          const categoryId = item.product_id
            ? productCategoryById.get(item.product_id)
            : null;
          const categoryName =
            (categoryId ? categoryNameById.get(categoryId) : null) ?? "Other";
          catSales.set(
            categoryName,
            (catSales.get(categoryName) ?? 0) + Number(item.total_price),
          );

          const key = item.product_name || "Unknown";
          const prev = productSales.get(key) ?? {
            name: key,
            sales: 0,
            quantity: 0,
          };
          prev.sales += Number(item.total_price);
          prev.quantity += Number(item.quantity) || 0;
          productSales.set(key, prev);
        }

        salesByCategory = Array.from(catSales.entries())
          .map(([category, sales]) => ({
            category,
            sales: Math.round(sales * 100) / 100,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 6);

        topProducts = Array.from(productSales.values())
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)
          .map((p) => ({ ...p, sales: Math.round(p.sales * 100) / 100 }));
      }

      return {
        revenue: Math.round(revenue * 100) / 100,
        ordersCount: orderRows.length,
        customersCount: customersCount ?? 0,
        pendingQuotes,
        lowStockCount,
        aov: Math.round(aov * 100) / 100,
        revenueOverTime:
          orderRows.length > 0 ? revenueOverTime : emptyRevenueOverTime(),
        ordersByStatus: Array.from(statusCounts.entries()).map(
          ([status, count]) => ({ status, count }),
        ),
        salesByCategory,
        topProducts,
      };
    } catch {
      // Fall through to demo metrics only when live reads fail
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
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      let query = supabase
        .from("products")
        .select(
          "*, brand:brands(*), category:categories(*), images:product_images(*)",
        )
        .order("name");

      if (opts?.active === "active") query = query.eq("active", true);
      if (opts?.active === "archived") query = query.eq("active", false);

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        let products = data.map((row) => {
          const r = row as unknown as Product & {
            price: number | string;
            compare_at_price: number | string | null;
          };
          const images = [...(r.images ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          );
          const primary = images.find((i) => i.is_primary) ?? images[0];
          return {
            ...r,
            price: Number(r.price),
            compare_at_price:
              r.compare_at_price != null ? Number(r.compare_at_price) : null,
            images,
            image_url: primary?.url ?? r.image_url ?? null,
          };
        });
        if (opts?.q?.trim()) {
          const q = opts.q;
          products = products
            .filter((p) => productMatchesQuery(p, q))
            .sort(
              (a, b) =>
                productSearchScore(b, q) - productSearchScore(a, q) ||
                a.name.localeCompare(b.name),
            );
        }
        return products;
      }
    } catch {
      // Fall through
    }
  }

  let products = SEED_PRODUCTS.map(seedToAdminProduct);
  if (opts?.active === "active") products = products.filter((p) => p.active);
  if (opts?.active === "archived") products = products.filter((p) => !p.active);
  if (opts?.q?.trim()) {
    const q = opts.q;
    products = products
      .filter((p) => productMatchesQuery(p, q))
      .sort(
        (a, b) =>
          productSearchScore(b, q) - productSearchScore(a, q) ||
          a.name.localeCompare(b.name),
      );
  }
  return products;
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, brand:brands(*), category:categories(*), images:product_images(*), specifications:product_specifications(*)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const mapped = data as unknown as Product;
        const images = [...(mapped.images ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        const specifications = [...(mapped.specifications ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        const primary = images.find((i) => i.is_primary) ?? images[0];
        return {
          ...mapped,
          price: Number(mapped.price),
          compare_at_price:
            mapped.compare_at_price != null
              ? Number(mapped.compare_at_price)
              : null,
          images,
          specifications,
          image_url: primary?.url ?? mapped.image_url ?? null,
        };
      }
    } catch {
      // Fall through
    }
  }

  const products = await getAdminProducts({ active: "all" });
  return products.find((p) => p.id === id) ?? null;
}

export async function getAdminCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      if (data) return data as Category[];
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
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data) {
        return data.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          logo_url: b.logo_url,
          website: b.website,
          active: b.active,
        }));
      }
    } catch {
      // Fall through
    }
  }
  return SEED_BRANDS;
}

export async function getAdminOrders(opts?: {
  status?: string;
  q?: string;
}): Promise<AdminOrder[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      let query = supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (opts?.status && opts.status !== "all") {
        query = query.eq("status", opts.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        let orders = (data as unknown as AdminOrder[]).map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          shipping_amount: Number(o.shipping_amount),
          tax_amount: Number(o.tax_amount),
          discount_amount: Number(o.discount_amount),
          total: Number(o.total),
          shipping_address: (o.shipping_address as Record<string, unknown>) ?? null,
        }));
        if (opts?.q?.trim()) {
          const q = opts.q.trim().toLowerCase();
          orders = orders.filter((o) => {
            const addr = o.shipping_address as Record<string, unknown> | null;
            const addressText = addr
              ? [addr.first_name, addr.last_name, addr.line1, addr.city, addr.company]
                  .filter((v) => typeof v === "string")
                  .join(" ")
              : "";
            return (
              matchesQuery(o.order_number, q) ||
              matchesQuery(o.email, q) ||
              matchesQuery(o.status, q) ||
              matchesQuery(addressText, q) ||
              o.items?.some(
                (item) =>
                  matchesQuery(item.product_name, q) ||
                  matchesQuery(item.sku, q),
              )
            );
          });
        }
        return orders;
      }
    } catch {
      // Fall through
    }
  }

  let orders = DEMO_ORDERS;
  if (opts?.status && opts.status !== "all") {
    orders = orders.filter((o) => o.status === opts.status);
  }
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    orders = orders.filter((o) => {
      const addr = o.shipping_address as Record<string, unknown> | null;
      const addressText = addr
        ? [addr.first_name, addr.last_name, addr.line1, addr.city, addr.company]
            .filter((v) => typeof v === "string")
            .join(" ")
        : "";
      return (
        matchesQuery(o.order_number, q) ||
        matchesQuery(o.email, q) ||
        matchesQuery(o.status, q) ||
        matchesQuery(addressText, q) ||
        o.items?.some(
          (item) =>
            matchesQuery(item.product_name, q) || matchesQuery(item.sku, q),
        )
      );
    });
  }
  return orders;
}

/** Order statuses that mean the goods came back or were never shipped. */
export const RETURN_STATUSES = ["refunded", "cancelled"] as const;

export type AdminOrderReturn = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  total: number;
  created_at: string;
};

export type AdminReturnsSummary = {
  refundedCount: number;
  refundedTotal: number;
  cancelledCount: number;
  cancelledTotal: number;
  /** Shipped or delivered orders, used as the return-rate baseline. */
  fulfilledCount: number;
  returnRate: number;
  recent: AdminOrderReturn[];
};

function summarizeReturns(
  rows: AdminOrderReturn[],
  fulfilledCount: number,
): AdminReturnsSummary {
  const refunded = rows.filter((r) => r.status === "refunded");
  const cancelled = rows.filter((r) => r.status === "cancelled");
  const sum = (list: AdminOrderReturn[]) =>
    list.reduce((acc, row) => acc + row.total, 0);
  const baseline = refunded.length + fulfilledCount;

  return {
    refundedCount: refunded.length,
    refundedTotal: sum(refunded),
    cancelledCount: cancelled.length,
    cancelledTotal: sum(cancelled),
    fulfilledCount,
    returnRate: baseline === 0 ? 0 : (refunded.length / baseline) * 100,
    recent: rows.slice(0, 5),
  };
}

export async function getAdminReturnsSummary(): Promise<AdminReturnsSummary> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const [returned, fulfilled] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, email, status, total, created_at")
          .in("status", [...RETURN_STATUSES])
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["shipped", "delivered"]),
      ]);

      if (returned.error) throw returned.error;
      if (returned.data) {
        return summarizeReturns(
          returned.data.map((row) => ({
            id: row.id,
            order_number: row.order_number,
            email: row.email,
            status: row.status,
            total: Number(row.total),
            created_at: row.created_at,
          })),
          fulfilled.count ?? 0,
        );
      }
    } catch {
      // Fall through
    }
  }

  const returnStatuses = new Set<string>(RETURN_STATUSES);
  return summarizeReturns(
    DEMO_ORDERS.filter((o) => returnStatuses.has(o.status)).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      email: o.email,
      status: o.status,
      total: Number(o.total),
      created_at: o.created_at,
    })),
    DEMO_ORDERS.filter(
      (o) => o.status === "shipped" || o.status === "delivered",
    ).length,
  );
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

export type AdminAffiliate = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  role: string;
  is_owner: boolean;
  promo_code: string;
  discount_percent: number;
  code_active: boolean;
  /** Orders placed with this affiliate's code. */
  uses: number;
  orders_count: number;
  total_spent: number;
  /** Admins share codes immediately; customers unlock after a purchase count. */
  eligible: boolean;
  created_at: string;
};

export type AdminAffiliateSummary = {
  affiliates: AdminAffiliate[];
  totalCount: number;
  eligibleCount: number;
  totalUses: number;
  activeCount: number;
};

function summarizeAffiliates(
  affiliates: AdminAffiliate[],
): AdminAffiliateSummary {
  return {
    affiliates,
    totalCount: affiliates.length,
    eligibleCount: affiliates.filter((a) => a.eligible).length,
    totalUses: affiliates.reduce((sum, a) => sum + a.uses, 0),
    activeCount: affiliates.filter((a) => a.code_active).length,
  };
}

export type AdminAffiliateApplication = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "declined";
  contact_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  audience: string;
  motivation: string | null;
  admin_note: string | null;
  /** Order count when they applied, kept for context alongside the live count. */
  orders_at_apply: number;
  orders_count: number;
  eligible: boolean;
  promo_code: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function getAdminAffiliateApplications(): Promise<
  AdminAffiliateApplication[]
> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: applications, error } = await supabase
      .from("affiliate_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!applications?.length) return [];

    const userIds = applications.map((a) => a.user_id);
    const [{ data: profiles }, { data: orders }] = await Promise.all([
      supabase.from("profiles").select("id, promo_code").in("id", userIds),
      supabase.from("orders").select("user_id, status").in("user_id", userIds),
    ]);

    const promoById = new Map(
      (profiles ?? []).map((p) => [p.id, p.promo_code ?? null]),
    );
    const ordersById = new Map<string, number>();
    for (const order of orders ?? []) {
      if (!order.user_id) continue;
      if (String(order.status).toLowerCase() === "cancelled") continue;
      ordersById.set(order.user_id, (ordersById.get(order.user_id) ?? 0) + 1);
    }

    return applications.map((a) => {
      const ordersCount = ordersById.get(a.user_id) ?? 0;
      return {
        id: a.id,
        user_id: a.user_id,
        status:
          a.status === "approved" || a.status === "declined"
            ? a.status
            : ("pending" as const),
        contact_name: a.contact_name,
        email: a.email,
        phone: a.phone,
        company: a.company,
        audience: a.audience,
        motivation: a.motivation,
        admin_note: a.admin_note,
        orders_at_apply: a.orders_at_apply,
        orders_count: ordersCount,
        eligible: ordersCount >= AFFILIATE_ELIGIBILITY_ORDERS,
        promo_code: promoById.get(a.user_id) ?? null,
        created_at: a.created_at,
        reviewed_at: a.reviewed_at,
      };
    });
  } catch {
    // Table lands with a migration; the page should still render without it.
    return [];
  }
}

export async function getAdminAffiliates(opts?: {
  q?: string;
}): Promise<AdminAffiliateSummary> {
  if (isSupabaseConfigured()) {
    try {
      // Service role: affiliate codes span every profile, including admins.
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const [coupons, profiles, orders] = await Promise.all([
        supabase
          .from("coupons")
          .select(
            "id, code, discount_value, used_count, active, owner_user_id, created_at",
          )
          .eq("is_affiliate", true),
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name, company, role, is_owner"),
        supabase.from("orders").select("user_id, total, status, coupon_code"),
      ]);

      if (coupons.error) throw coupons.error;

      const profileById = new Map(
        (profiles.data ?? []).map((profile) => [profile.id, profile]),
      );
      const usesByCode = new Map<string, number>();
      const statsByUser = new Map<string, { count: number; spent: number }>();

      for (const order of orders.data ?? []) {
        if (String(order.status).toLowerCase() === "cancelled") continue;
        if (order.coupon_code) {
          const code = order.coupon_code.toUpperCase();
          usesByCode.set(code, (usesByCode.get(code) ?? 0) + 1);
        }
        if (order.user_id) {
          const prev = statsByUser.get(order.user_id) ?? { count: 0, spent: 0 };
          statsByUser.set(order.user_id, {
            count: prev.count + 1,
            spent: prev.spent + (Number(order.total) || 0),
          });
        }
      }

      const { isAdminRole } = await import("@/lib/utils");

      let affiliates: AdminAffiliate[] = (coupons.data ?? [])
        .filter((coupon) => coupon.owner_user_id)
        .map((coupon) => {
          const profile = profileById.get(coupon.owner_user_id!);
          const stats = statsByUser.get(coupon.owner_user_id!);
          const role = String(profile?.role ?? "customer");
          const isOwner = profile?.is_owner === true;
          const ordersCount = stats?.count ?? 0;
          return {
            id: coupon.owner_user_id!,
            email: profile?.email ?? "—",
            first_name: profile?.first_name ?? null,
            last_name: profile?.last_name ?? null,
            company: profile?.company ?? null,
            role,
            is_owner: isOwner,
            promo_code: coupon.code,
            discount_percent: Number(coupon.discount_value) || 0,
            code_active: coupon.active !== false,
            uses: usesByCode.get(coupon.code.toUpperCase()) ?? 0,
            orders_count: ordersCount,
            total_spent: stats?.spent ?? 0,
            eligible:
              isAdminRole(role) || isOwner
                ? true
                : ordersCount >= AFFILIATE_ELIGIBILITY_ORDERS,
            created_at: coupon.created_at,
          };
        })
        .sort(
          (a, b) =>
            b.uses - a.uses ||
            b.orders_count - a.orders_count ||
            a.promo_code.localeCompare(b.promo_code),
        );

      if (opts?.q?.trim()) {
        const q = opts.q.trim().toLowerCase();
        affiliates = affiliates.filter(
          (a) =>
            matchesQuery(a.promo_code, q) ||
            matchesQuery(a.email, q) ||
            matchesQuery(a.first_name, q) ||
            matchesQuery(a.last_name, q) ||
            matchesQuery(a.company, q),
        );
      }

      return summarizeAffiliates(affiliates);
    } catch {
      // Fall through
    }
  }

  return summarizeAffiliates([]);
}

export async function getAdminCustomers(opts?: {
  q?: string;
}): Promise<AdminCustomer[]> {
  if (isSupabaseConfigured()) {
    try {
      // Service role: admin CRM must see every customer profile (bypass RLS).
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const [{ data: profiles, error: profilesError }, { data: orders }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("orders").select("user_id, email, total, status"),
        ]);

      if (profilesError) throw profilesError;

      if (profiles && profiles.length >= 0) {
        const spentByUser = new Map<string, { count: number; spent: number }>();
        const spentByEmail = new Map<string, { count: number; spent: number }>();

        for (const order of orders ?? []) {
          const total = Number(order.total) || 0;
          const cancelled = String(order.status).toLowerCase() === "cancelled";
          if (cancelled) continue;

          if (order.user_id) {
            const prev = spentByUser.get(order.user_id) ?? { count: 0, spent: 0 };
            spentByUser.set(order.user_id, {
              count: prev.count + 1,
              spent: prev.spent + total,
            });
          }
          if (order.email) {
            const key = String(order.email).toLowerCase();
            const prev = spentByEmail.get(key) ?? { count: 0, spent: 0 };
            spentByEmail.set(key, {
              count: prev.count + 1,
              spent: prev.spent + total,
            });
          }
        }

        const { isAdminRole } = await import("@/lib/utils");

        let customers = profiles
          .filter((p) => {
            const role = String(p.role ?? "").toLowerCase();
            // Customers page = every non-admin / non-support account
            if (!role || role === "customer") return true;
            if (isAdminRole(p.role)) return false;
            if (role === "support" || role === "staff") return false;
            return true;
          })
          .map((p) => {
            const byId = spentByUser.get(p.id);
            const byEmail = spentByEmail.get(String(p.email ?? "").toLowerCase());
            return {
              id: p.id,
              email: p.email,
              first_name: p.first_name,
              last_name: p.last_name,
              company: p.company,
              phone: p.phone,
              role: "customer" as Profile["role"],
              created_at: p.created_at,
              avatar_url: (p as { avatar_url?: string | null }).avatar_url ?? null,
              state: (p as { state?: string | null }).state ?? null,
              postal_code: (p as { postal_code?: string | null }).postal_code ?? null,
              promo_code: (p as { promo_code?: string | null }).promo_code ?? null,
              orders_count: byId?.count ?? byEmail?.count ?? 0,
              total_spent: byId?.spent ?? byEmail?.spent ?? 0,
            };
          });

        if (opts?.q?.trim()) {
          const q = opts.q.trim().toLowerCase();
          customers = customers.filter(
            (c) =>
              matchesQuery(c.email, q) ||
              matchesQuery(c.company, q) ||
              matchesQuery(c.phone, q) ||
              matchesQuery(c.promo_code, q) ||
              matchesQuery(
                [c.first_name, c.last_name].filter(Boolean).join(" "),
                q,
              ),
          );
        }
        return customers;
      }
    } catch {
      // Fall through to demo only when Supabase is unavailable
    }
  }
  let customers = DEMO_CUSTOMERS;
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    customers = customers.filter(
      (c) =>
        matchesQuery(c.email, q) ||
        matchesQuery(c.company, q) ||
        matchesQuery(c.phone, q) ||
        matchesQuery(c.promo_code, q) ||
        matchesQuery([c.first_name, c.last_name].filter(Boolean).join(" "), q),
    );
  }
  return customers;
}

export async function getAdminCustomer(
  id: string,
): Promise<AdminCustomerDetail | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      const { isAdminRole } = await import("@/lib/utils");
      const role = String(profile?.role ?? "").toLowerCase();
      const isCustomerProfile =
        profile &&
        (!role || role === "customer") &&
        !isAdminRole(profile.role) &&
        role !== "support" &&
        role !== "staff";

      if (isCustomerProfile && profile) {
        const email = String(profile.email ?? "");
        const [{ data: ordersByUser }, { data: ordersByEmail }, { data: quotesByUser }, { data: quotesByEmail }] =
          await Promise.all([
            supabase
              .from("orders")
              .select("*, items:order_items(*)")
              .eq("user_id", id)
              .order("created_at", { ascending: false }),
            email
              ? supabase
                  .from("orders")
                  .select("*, items:order_items(*)")
                  .eq("email", email)
                  .order("created_at", { ascending: false })
              : Promise.resolve({ data: [] as never[] }),
            supabase
              .from("quotes")
              .select("*")
              .eq("user_id", id)
              .order("created_at", { ascending: false }),
            email
              ? supabase
                  .from("quotes")
                  .select("*")
                  .eq("email", email)
                  .order("created_at", { ascending: false })
              : Promise.resolve({ data: [] as never[] }),
          ]);

        const orderMap = new Map<string, AdminOrder>();
        for (const row of [...(ordersByUser ?? []), ...(ordersByEmail ?? [])]) {
          const o = row as unknown as AdminOrder;
          orderMap.set(o.id, {
            ...o,
            subtotal: Number(o.subtotal),
            shipping_amount: Number(o.shipping_amount),
            tax_amount: Number(o.tax_amount),
            discount_amount: Number(o.discount_amount),
            total: Number(o.total),
            shipping_address:
              (o.shipping_address as Record<string, unknown>) ?? null,
          });
        }
        const mappedOrders = [...orderMap.values()].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const quoteMap = new Map<string, AdminQuote>();
        for (const row of [...(quotesByUser ?? []), ...(quotesByEmail ?? [])]) {
          const q = row as AdminQuote;
          quoteMap.set(q.id, {
            ...q,
            total: q.total != null ? Number(q.total) : null,
            shipping_address:
              (q.shipping_address as Record<string, unknown>) ?? null,
          });
        }
        const mappedQuotes = [...quoteMap.values()].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const activeOrders = mappedOrders.filter(
          (o) => String(o.status).toLowerCase() !== "cancelled",
        );

        const promoCode =
          (profile as { promo_code?: string | null }).promo_code ?? null;
        let affiliateDiscount: number | null = null;
        let affiliateActive: boolean | null = null;
        const couponId = (profile as { affiliate_coupon_id?: string | null })
          .affiliate_coupon_id;
        if (couponId) {
          const { data } = await supabase
            .from("coupons")
            .select("discount_value, discount_type, active")
            .eq("id", couponId)
            .maybeSingle();
          const coupon = data as {
            discount_value: number | string | null;
            discount_type: string | null;
            active: boolean | null;
          } | null;
          if (coupon) {
            affiliateDiscount = Number(coupon.discount_value);
            affiliateActive = Boolean(coupon.active);
          }
        }

        return {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          phone: profile.phone,
          role: "customer",
          created_at: profile.created_at,
          updated_at: (profile as { updated_at?: string | null }).updated_at ?? null,
          avatar_url: (profile as { avatar_url?: string | null }).avatar_url ?? null,
          state: (profile as { state?: string | null }).state ?? null,
          postal_code:
            (profile as { postal_code?: string | null }).postal_code ?? null,
          promo_code: promoCode,
          affiliate_discount_percent: affiliateDiscount,
          affiliate_coupon_active: affiliateActive,
          orders_count: activeOrders.length,
          total_spent: activeOrders.reduce((sum, o) => sum + o.total, 0),
          quotes_count: mappedQuotes.length,
          orders: mappedOrders,
          quotes: mappedQuotes,
        };
      }
    } catch {
      // Fall through
    }
  }

  const demo = DEMO_CUSTOMERS.find((c) => c.id === id);
  if (!demo) return null;

  const demoOrders = DEMO_ORDERS.filter(
    (o) => o.email.toLowerCase() === demo.email.toLowerCase(),
  );
  const demoQuotes = DEMO_QUOTES.filter(
    (q) => q.email.toLowerCase() === demo.email.toLowerCase(),
  );

  return {
    ...demo,
    avatar_url: null,
    state: null,
    postal_code: null,
    updated_at: demo.created_at,
    promo_code: demo.promo_code ?? `JORDAN-${demo.id.slice(-4).toUpperCase()}`,
    affiliate_discount_percent: 10,
    affiliate_coupon_active: true,
    orders: demoOrders,
    quotes: demoQuotes,
    quotes_count: demoQuotes.length,
  };
}

const DEMO_MEMBERS: AdminMember[] = [
  {
    id: "m0000000-0000-4000-8000-000000000001",
    email: "admin@gmail.com",
    first_name: "Master",
    last_name: "Admin",
    company: "Titan Safety Co.",
    phone: null,
    role: "admin",
    is_owner: true,
    avatar_url: null,
    date_of_birth: null,
    promo_code: null,
    created_at: daysAgo(365),
  },
];

export async function getAdminMembers(opts?: {
  q?: string;
}): Promise<AdminMember[]> {
  const filterMembers = (members: AdminMember[]) => {
    if (!opts?.q?.trim()) return members;
    const q = opts.q.trim().toLowerCase();
    return members.filter(
      (m) =>
        matchesQuery(m.email, q) ||
        matchesQuery(m.company, q) ||
        matchesQuery(m.role, q) ||
        matchesQuery([m.first_name, m.last_name].filter(Boolean).join(" "), q),
    );
  };

  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const { isAdminRole, isMasterAdminEmail } = await import("@/lib/utils");
        return filterMembers(
          data
            .filter(
              (p) =>
                isAdminRole(p.role) ||
                p.is_owner === true ||
                isMasterAdminEmail(p.email),
            )
            .map((p) => ({
              id: p.id,
              email: p.email,
              first_name: p.first_name,
              last_name: p.last_name,
              company: p.company,
              phone: p.phone,
              role: (isAdminRole(p.role) ? "admin" : "staff") as Profile["role"],
              is_owner: Boolean(p.is_owner) || isMasterAdminEmail(p.email),
              avatar_url: p.avatar_url ?? null,
              date_of_birth: p.date_of_birth ?? null,
              promo_code: p.promo_code ?? null,
              created_at: p.created_at,
            })),
        );
      }
    } catch {
      // Fall through
    }
  }

  return filterMembers(DEMO_MEMBERS);
}

export async function getAdminMember(id: string): Promise<AdminMember | null> {
  const members = await getAdminMembers();
  return members.find((m) => m.id === id) ?? null;
}

export async function getAdminQuotes(opts?: {
  status?: string;
  q?: string;
}): Promise<AdminQuote[]> {
  const filterQuotes = (quotes: AdminQuote[]) => {
    let next = quotes;
    if (opts?.status && opts.status !== "all") {
      next = next.filter((q) => q.status === opts.status);
    }
    if (opts?.q?.trim()) {
      const q = opts.q.trim().toLowerCase();
      next = next.filter(
        (row) =>
          matchesQuery(row.quote_number, q) ||
          matchesQuery(row.company, q) ||
          matchesQuery(row.contact_name, q) ||
          matchesQuery(row.email, q) ||
          matchesQuery(row.project_name, q) ||
          matchesQuery(row.status, q),
      );
    }
    return next;
  };

  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      let query = supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
      if (opts?.status && opts.status !== "all") {
        query = query.eq("status", opts.status);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        const quotes = data.map((q) => ({
          ...q,
          total: q.total != null ? Number(q.total) : null,
          shipping_address: (q.shipping_address as Record<string, unknown>) ?? null,
        })) as AdminQuote[];
        return filterQuotes(quotes);
      }
    } catch {
      // Fall through
    }
  }

  return filterQuotes(DEMO_QUOTES);
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
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
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

function readPercent(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 100) return fallback;
  return n;
}

export async function getPromoDiscountSettings(): Promise<PromoDiscountSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "promo_discounts")
        .maybeSingle();
      const value = data?.value as
        | { customer?: unknown; admin?: unknown }
        | null;
      if (value) {
        return {
          customerPercent: readPercent(
            value.customer,
            DEFAULT_PROMO_DISCOUNTS.customerPercent,
          ),
          adminPercent: readPercent(
            value.admin,
            DEFAULT_PROMO_DISCOUNTS.adminPercent,
          ),
        };
      }
    } catch {
      // Fall through
    }
  }
  return DEFAULT_PROMO_DISCOUNTS;
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

async function getStoredCatalogTags(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_tags")
        .maybeSingle();
      const value = data?.value as { tags?: unknown } | null;
      if (Array.isArray(value?.tags)) {
        return value.tags
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoCatalogTags();
}

async function getStoredPrimaryCatalogTags(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_primary_tags")
        .maybeSingle();
      const value = data?.value as { tags?: unknown } | null;
      if (Array.isArray(value?.tags)) {
        return value.tags
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoPrimaryCatalogTags();
}

async function getRemovedCatalogTags(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_tags_removed")
        .maybeSingle();
      const value = data?.value as { tags?: unknown } | null;
      if (Array.isArray(value?.tags)) {
        return value.tags
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoRemovedCatalogTags();
}

function productTagValue(product: Product): string | null {
  const tag = product.metadata?.tag;
  return typeof tag === "string" && tag.trim() ? tag.trim() : null;
}

async function getStoredCatalogSizes(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_sizes")
        .maybeSingle();
      const value = data?.value as { sizes?: unknown } | null;
      if (Array.isArray(value?.sizes)) {
        return value.sizes
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoCatalogSizes();
}

async function getStoredCatalogDepartments(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments")
        .maybeSingle();
      const value = data?.value as { departments?: unknown } | null;
      if (Array.isArray(value?.departments)) {
        return value.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoCatalogDepartments();
}

async function getStoredPrimaryCatalogDepartments(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_primary_departments")
        .maybeSingle();
      const value = data?.value as { departments?: unknown } | null;
      if (Array.isArray(value?.departments)) {
        return value.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoPrimaryCatalogDepartments();
}

async function getStoredOfflineCatalogDepartments(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_offline_departments")
        .maybeSingle();
      const value = data?.value as { departments?: unknown } | null;
      if (Array.isArray(value?.departments)) {
        return value.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoOfflineCatalogDepartments();
}

async function getRemovedCatalogDepartments(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "catalog_departments_removed")
        .maybeSingle();
      const value = data?.value as { departments?: unknown } | null;
      if (Array.isArray(value?.departments)) {
        return value.departments
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim());
      }
    } catch {
      // Fall through
    }
  }
  return getDemoRemovedCatalogDepartments();
}

/**
 * Department options for the product form and shop filters —
 * canonical + admin-added + departments already in use on products.
 * Pass `liveOnly: true` for the storefront (excludes off-line departments).
 */
export async function getCatalogDepartmentOptions(opts?: {
  liveOnly?: boolean;
}): Promise<DepartmentOption[]> {
  const [products, customDepartments, primaryDepartments, offlineDepartments, removed] =
    await Promise.all([
      getAdminProducts({ active: "all" }),
      getStoredCatalogDepartments(),
      getStoredPrimaryCatalogDepartments(),
      getStoredOfflineCatalogDepartments(),
      getRemovedCatalogDepartments(),
    ]);
  const removedKeys = new Set(removed.map((d) => d.toLowerCase()));
  const offlineKeys = new Set(offlineDepartments.map((d) => d.toLowerCase()));

  const merged = new Map<string, DepartmentOption>();
  for (const option of DEPARTMENT_OPTIONS) {
    if (removedKeys.has(option.value.toLowerCase())) continue;
    if (opts?.liveOnly && offlineKeys.has(option.value.toLowerCase())) continue;
    merged.set(option.value.toLowerCase(), option);
  }
  for (const name of [
    ...DEFAULT_PRIMARY_DEPARTMENTS,
    ...primaryDepartments,
    ...customDepartments,
    ...(opts?.liveOnly ? [] : offlineDepartments),
    ...products
      .map((p) => p.department)
      .filter((d): d is string => Boolean(d?.trim())),
  ]) {
    const key = name.toLowerCase();
    if (removedKeys.has(key) || merged.has(key)) continue;
    if (opts?.liveOnly && offlineKeys.has(key)) continue;
    merged.set(key, toDepartmentOption(name));
  }
  return Array.from(merged.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

/** Department management rows for the Categories page. */
export async function getAdminDepartments(): Promise<AdminDepartment[]> {
  const [products, customDepartments, primaryDepartments, offlineDepartments, removed] =
    await Promise.all([
      getAdminProducts({ active: "all" }),
      getStoredCatalogDepartments(),
      getStoredPrimaryCatalogDepartments(),
      getStoredOfflineCatalogDepartments(),
      getRemovedCatalogDepartments(),
    ]);
  const removedKeys = new Set(removed.map((d) => d.toLowerCase()));
  const offlineKeys = new Set(offlineDepartments.map((d) => d.toLowerCase()));

  const counts = new Map<string, number>();
  for (const product of products) {
    const department = product.department?.trim();
    if (!department) continue;
    const key = department.toLowerCase();
    if (removedKeys.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const canonical = new Map(
    [
      ...DEPARTMENT_OPTIONS.map((o) => o.value),
      ...DEFAULT_PRIMARY_DEPARTMENTS,
      ...primaryDepartments,
    ]
      .filter((name) => !removedKeys.has(name.toLowerCase()))
      .map((name) => {
        const option = toDepartmentOption(name);
        return [option.value.toLowerCase(), option] as const;
      }),
  );
  const custom = new Map(
    customDepartments
      .filter((name) => !removedKeys.has(name.toLowerCase()))
      .map((name) => {
        const option = toDepartmentOption(name);
        return [option.value.toLowerCase(), option] as const;
      }),
  );
  const offline = new Map(
    offlineDepartments
      .filter((name) => !removedKeys.has(name.toLowerCase()))
      .map((name) => {
        const option = toDepartmentOption(name);
        return [option.value.toLowerCase(), option] as const;
      }),
  );
  const names = new Map<string, DepartmentOption>();

  for (const [key, option] of canonical) names.set(key, option);
  for (const [key, option] of custom) names.set(key, option);
  for (const [key, option] of offline) names.set(key, option);
  for (const product of products) {
    const department = product.department?.trim();
    if (!department) continue;
    const key = department.toLowerCase();
    if (removedKeys.has(key) || names.has(key)) continue;
    names.set(key, toDepartmentOption(department));
  }

  return Array.from(names.entries())
    .map(([key, option]) => {
      let source: AdminDepartment["source"] = "product";
      if (offlineKeys.has(key) || offline.has(key)) source = "offline";
      else if (canonical.has(key)) source = "catalog";
      else if (custom.has(key)) source = "custom";
      return {
        name: option.value,
        slug: option.slug,
        productCount: counts.get(key) ?? 0,
        source,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Every size a product already uses, from the size field and the variant matrix. */
function productSizeValues(product: Product): string[] {
  const sizes: string[] = [];
  if (product.size?.trim()) sizes.push(product.size.trim());

  const variants = product.metadata?.variants;
  if (Array.isArray(variants)) {
    for (const row of variants) {
      const size = (row as { size?: unknown } | null)?.size;
      if (typeof size === "string" && size.trim()) sizes.push(size.trim());
    }
  }
  return sizes;
}

/**
 * Size options for the product form — canonical + admin-added + sizes already in
 * use. Canonical order is preserved (S…4XL) since sizes do not sort alphabetically.
 */
export async function getCatalogSizeOptions(): Promise<CatalogOption[]> {
  const [products, customSizes] = await Promise.all([
    getAdminProducts({ active: "all" }),
    getStoredCatalogSizes(),
  ]);

  const merged = new Map<string, CatalogOption>();
  for (const option of [...SIZE_OPTIONS, ...SHOE_SIZE_OPTIONS]) {
    merged.set(option.value.toLowerCase(), option);
  }
  for (const size of [...customSizes, ...products.flatMap(productSizeValues)]) {
    const key = size.toLowerCase();
    if (!merged.has(key)) merged.set(key, { label: size, value: size });
  }
  return sortCatalogSizes(Array.from(merged.values()));
}

/** Tag options for the product form — canonical + custom + tags already on products. */
export async function getCatalogTagOptions(): Promise<CatalogOption[]> {
  const [products, customTags, primaryTags, removed] = await Promise.all([
    getAdminProducts({ active: "all" }),
    getStoredCatalogTags(),
    getStoredPrimaryCatalogTags(),
    getRemovedCatalogTags(),
  ]);
  const removedKeys = new Set(removed.map((t) => t.toLowerCase()));
  const fromProducts = products
    .map(productTagValue)
    .filter((t): t is string => t != null && !removedKeys.has(t.toLowerCase()));
  const activeCanonical = [
    ...PRODUCT_TAG_OPTIONS.filter(
      (o) => !removedKeys.has(o.value.toLowerCase()),
    ),
    ...primaryTags
      .filter((t) => !removedKeys.has(t.toLowerCase()))
      .map((t) => ({ label: t, value: t })),
  ];
  const activeCustom = customTags.filter(
    (t) => !removedKeys.has(t.toLowerCase()),
  );
  return mergeCatalogOptions(activeCanonical, [...activeCustom, ...fromProducts]);
}

/** Tag management rows for the Categories page. */
export async function getAdminTags(): Promise<AdminTag[]> {
  const [products, customTags, primaryTags, removed] = await Promise.all([
    getAdminProducts({ active: "all" }),
    getStoredCatalogTags(),
    getStoredPrimaryCatalogTags(),
    getRemovedCatalogTags(),
  ]);
  const removedKeys = new Set(removed.map((t) => t.toLowerCase()));

  const counts = new Map<string, number>();
  for (const product of products) {
    const tag = productTagValue(product);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (removedKeys.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const canonical = new Map(
    [
      ...PRODUCT_TAG_OPTIONS.map((o) => o.value),
      ...primaryTags,
    ]
      .filter((t) => !removedKeys.has(t.toLowerCase()))
      .map((t) => [t.toLowerCase(), t] as const),
  );
  const custom = new Map(
    customTags
      .filter((t) => !removedKeys.has(t.toLowerCase()))
      .map((t) => [t.toLowerCase(), t]),
  );
  const names = new Map<string, string>();

  for (const [key, value] of canonical) names.set(key, value);
  for (const [key, value] of custom) names.set(key, value);
  for (const product of products) {
    const tag = productTagValue(product);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (removedKeys.has(key)) continue;
    if (!names.has(key)) names.set(key, tag);
  }

  return Array.from(names.entries())
    .map(([key, name]) => {
      let source: AdminTag["source"] = "product";
      if (canonical.has(key)) source = "catalog";
      else if (custom.has(key)) source = "custom";
      return {
        name,
        productCount: counts.get(key) ?? 0,
        source,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
