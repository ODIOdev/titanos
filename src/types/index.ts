export type UserRole = "customer" | "staff" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type QuoteStatus =
  | "submitted"
  | "reviewing"
  | "information_requested"
  | "quoted"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  active: boolean;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website?: string | null;
  active: boolean;
};

export type Product = {
  id: string;
  category_id: string | null;
  brand_id: string | null;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  inventory_quantity: number;
  low_stock_threshold: number;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
  weight: number | null;
  shipping_class: string | null;
  rating_avg: number;
  rating_count: number;
  ansi_class: string | null;
  color: string | null;
  size: string | null;
  product_type: string | null;
  department: string | null;
  metadata: Record<string, unknown> | null;
  image_url?: string | null;
  brand?: Brand | null;
  category?: Category | null;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductSpecification = {
  id: string;
  product_id: string;
  name: string;
  value: string;
  sort_order: number;
};

export type CartItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  product?: Product;
};

export type CartState = {
  items: CartItem[];
  updatedAt: string;
};

export type Address = {
  id: string;
  user_id: string;
  type: "shipping" | "billing";
  is_default: boolean;
  first_name: string;
  last_name: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Quote = {
  id: string;
  quote_number: string;
  user_id: string | null;
  contact_name: string;
  company: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  project_name: string | null;
  status: QuoteStatus;
  total: number | null;
  created_at: string;
};

export type Resource = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published: boolean;
  created_at: string;
};

export type ProductFilters = {
  category?: string;
  brand?: string;
  department?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  productType?: string;
  ansiClass?: string;
  color?: string;
  size?: string;
  availability?: "in_stock" | "all";
  rating?: number;
  q?: string;
  sort?: string;
  page?: number;
  featured?: boolean;
  bestseller?: boolean;
};
