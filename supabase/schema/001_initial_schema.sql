-- =============================================================================
-- Titan Safety Co. — Initial Schema Migration
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Utility: updated_at trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- Utility: role helpers (security definer)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
  );
$$;

-- =============================================================================
-- profiles
-- =============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_role ON public.profiles (role);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- addresses
-- =============================================================================

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('shipping', 'billing')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX idx_addresses_user_type ON public.addresses (user_id, type);

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- categories
-- =============================================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sku_prefix TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories (slug);
CREATE INDEX idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX idx_categories_active ON public.categories (active);
CREATE INDEX idx_categories_sort_order ON public.categories (sort_order);
CREATE INDEX idx_categories_department ON public.categories (department);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- brands
-- =============================================================================

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON public.brands (slug);
CREATE INDEX idx_brands_active ON public.brands (active);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- products
-- =============================================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  cost NUMERIC(10, 2) CHECK (cost IS NULL OR cost >= 0),
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  weight NUMERIC(10, 2),
  shipping_class TEXT,
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  ansi_class TEXT,
  color TEXT,
  size TEXT,
  product_type TEXT,
  department TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON public.products (slug);
CREATE INDEX idx_products_sku ON public.products (sku);
CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_brand_id ON public.products (brand_id);
CREATE INDEX idx_products_active ON public.products (active);
CREATE INDEX idx_products_featured ON public.products (featured) WHERE featured = TRUE;
CREATE INDEX idx_products_bestseller ON public.products (bestseller) WHERE bestseller = TRUE;
CREATE INDEX idx_products_price ON public.products (price);
CREATE INDEX idx_products_search_vector ON public.products USING GIN (search_vector);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, sku, short_description, description
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_search_vector_update();

-- =============================================================================
-- product_images
-- =============================================================================

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON public.product_images (product_id);
CREATE INDEX idx_product_images_sort_order ON public.product_images (product_id, sort_order);

CREATE TRIGGER product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- product_variants
-- =============================================================================

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON public.product_variants (product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants (sku);
CREATE INDEX idx_product_variants_active ON public.product_variants (active);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- product_specifications
-- =============================================================================

CREATE TABLE public.product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_specifications_product_id ON public.product_specifications (product_id);
CREATE INDEX idx_product_specifications_sort_order ON public.product_specifications (product_id, sort_order);

CREATE TRIGGER product_specifications_updated_at
  BEFORE UPDATE ON public.product_specifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- inventory_movements
-- =============================================================================

CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements (product_id);
CREATE INDEX idx_inventory_movements_variant_id ON public.inventory_movements (variant_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements (created_at DESC);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements (reference_type, reference_id);

-- =============================================================================
-- carts
-- =============================================================================

CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carts_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user_id ON public.carts (user_id);
CREATE INDEX idx_carts_session_id ON public.carts (session_id);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- cart_items
-- =============================================================================

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items (cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items (product_id);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- wishlists
-- =============================================================================

CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlists_user_id ON public.wishlists (user_id);

CREATE TRIGGER wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- wishlist_items
-- =============================================================================

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON public.wishlist_items (wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON public.wishlist_items (product_id);

-- =============================================================================
-- coupons (created before orders for optional future FK use)
-- =============================================================================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount IS NULL OR min_order_amount >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_ends_after_starts CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_coupons_code ON public.coupons (code);
CREATE INDEX idx_coupons_active ON public.coupons (active);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- orders
-- =============================================================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
  ),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  internal_notes TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON public.orders (order_number);
CREATE INDEX idx_orders_user_id ON public.orders (user_id);
CREATE INDEX idx_orders_email ON public.orders (email);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_stripe_checkout_session_id ON public.orders (stripe_checkout_session_id);
CREATE INDEX idx_orders_stripe_payment_intent_id ON public.orders (stripe_payment_intent_id);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- order_items
-- =============================================================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- order_status_history
-- =============================================================================

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history (order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history (created_at DESC);

-- =============================================================================
-- quotes
-- =============================================================================

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  company TEXT,
  ein TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  project_name TEXT,
  requested_delivery_date DATE,
  urgency TEXT CHECK (
    urgency IS NULL OR urgency IN (
      'standard',
      'soon',
      'urgent',
      'emergency'
    )
  ),
  shipping_address JSONB,
  tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  custom_product_description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN (
      'submitted',
      'reviewing',
      'information_requested',
      'quoted',
      'accepted',
      'rejected',
      'expired',
      'converted'
    )
  ),
  internal_notes TEXT,
  subtotal NUMERIC(10, 2) DEFAULT 0 CHECK (subtotal IS NULL OR subtotal >= 0),
  discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount IS NULL OR discount_amount >= 0),
  shipping_amount NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_amount IS NULL OR shipping_amount >= 0),
  tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount IS NULL OR tax_amount >= 0),
  total NUMERIC(10, 2) DEFAULT 0 CHECK (total IS NULL OR total >= 0),
  expires_at TIMESTAMPTZ,
  converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_quote_number ON public.quotes (quote_number);
CREATE INDEX idx_quotes_user_id ON public.quotes (user_id);
CREATE INDEX idx_quotes_email ON public.quotes (email);
CREATE INDEX idx_quotes_status ON public.quotes (status);
CREATE INDEX idx_quotes_created_at ON public.quotes (created_at DESC);

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- quote_items
-- =============================================================================

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) CHECK (unit_price IS NULL OR unit_price >= 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote_id ON public.quote_items (quote_id);
CREATE INDEX idx_quote_items_product_id ON public.quote_items (product_id);

CREATE TRIGGER quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- quote_attachments
-- =============================================================================

CREATE TABLE public.quote_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_attachments_quote_id ON public.quote_attachments (quote_id);

-- =============================================================================
-- reviews
-- =============================================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX idx_reviews_approved ON public.reviews (approved) WHERE approved = TRUE;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- newsletter_subscribers
-- =============================================================================

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers (email);
CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers (active);

-- =============================================================================
-- resources
-- =============================================================================

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  file_path TEXT,
  category TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_slug ON public.resources (slug);
CREATE INDEX idx_resources_published ON public.resources (published);
CREATE INDEX idx_resources_category ON public.resources (category);

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- coupon_redemptions
-- =============================================================================

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_redemptions_coupon_id ON public.coupon_redemptions (coupon_id);
CREATE INDEX idx_coupon_redemptions_user_id ON public.coupon_redemptions (user_id);
CREATE INDEX idx_coupon_redemptions_order_id ON public.coupon_redemptions (order_id);

-- =============================================================================
-- site_settings
-- =============================================================================

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_settings_key ON public.site_settings (key);

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Public read: active catalog
-- -----------------------------------------------------------------------------

CREATE POLICY "Public can read active categories"
  ON public.categories FOR SELECT
  USING (active = TRUE OR public.is_admin());

CREATE POLICY "Public can read active brands"
  ON public.brands FOR SELECT
  USING (active = TRUE OR public.is_admin());

CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (active = TRUE OR public.is_admin());

CREATE POLICY "Public can read images of active products"
  ON public.product_images FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.active = TRUE
    )
  );

CREATE POLICY "Public can read variants of active products"
  ON public.product_variants FOR SELECT
  USING (
    public.is_admin()
    OR (
      active = TRUE
      AND EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id AND p.active = TRUE
      )
    )
  );

CREATE POLICY "Public can read specs of active products"
  ON public.product_specifications FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_specifications.product_id AND p.active = TRUE
    )
  );

CREATE POLICY "Public can read published non-private resources"
  ON public.resources FOR SELECT
  USING (
    public.is_admin()
    OR (published = TRUE AND is_private = FALSE)
  );

CREATE POLICY "Public can read approved reviews"
  ON public.reviews FOR SELECT
  USING (approved = TRUE OR public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Public can insert newsletter subscribers"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public can read active coupons"
  ON public.coupons FOR SELECT
  USING (
    public.is_admin()
    OR (
      active = TRUE
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    )
  );

CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT
  USING (TRUE);

-- -----------------------------------------------------------------------------
-- Authenticated users: profiles
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin() OR public.is_staff_or_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- Authenticated users: addresses
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- Authenticated users: carts
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can manage own carts"
  ON public.carts FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Authenticated users: wishlists
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can manage own wishlists"
  ON public.wishlists FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own wishlist items"
  ON public.wishlist_items FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_items.wishlist_id AND w.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Authenticated users: orders (read own)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_staff_or_admin());

CREATE POLICY "Users can read own order items"
  ON public.order_items FOR SELECT
  USING (
    public.is_admin()
    OR public.is_staff_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own order status history"
  ON public.order_status_history FOR SELECT
  USING (
    public.is_admin()
    OR public.is_staff_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Authenticated users: quotes (read + insert)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can read own quotes"
  ON public.quotes FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_staff_or_admin());

CREATE POLICY "Users can insert own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR public.is_admin());

CREATE POLICY "Users can read own quote items"
  ON public.quote_items FOR SELECT
  USING (
    public.is_admin()
    OR public.is_staff_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_items.quote_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_items.quote_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own quote attachments"
  ON public.quote_attachments FOR SELECT
  USING (
    public.is_admin()
    OR public.is_staff_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_attachments.quote_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quote attachments"
  ON public.quote_attachments FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_attachments.quote_id AND q.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Authenticated users: reviews (insert own)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- Admin: full manage on all business tables
-- -----------------------------------------------------------------------------

CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage brands"
  ON public.brands FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage product specifications"
  ON public.product_specifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage inventory movements"
  ON public.inventory_movements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage carts"
  ON public.carts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage cart items"
  ON public.cart_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage wishlists"
  ON public.wishlists FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage wishlist items"
  ON public.wishlist_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage order status history"
  ON public.order_status_history FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage quotes"
  ON public.quotes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage quote items"
  ON public.quote_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage quote attachments"
  ON public.quote_attachments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage newsletter subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage coupon redemptions"
  ON public.coupon_redemptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own coupon redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- =============================================================================
-- Storage buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    TRUE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'category-images',
    'category-images',
    TRUE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'brand-logos',
    'brand-logos',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'quote-attachments',
    'quote-attachments',
    FALSE,
    26214400,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  ),
  (
    'resource-files',
    'resource-files',
    FALSE,
    52428800,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'video/mp4'
    ]
  ),
  (
    'avatars',
    'avatars',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Storage policies
-- =============================================================================

-- product-images (public)
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

-- category-images (public)
CREATE POLICY "Public can view category images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload category images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

CREATE POLICY "Admins can update category images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'category-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

CREATE POLICY "Admins can delete category images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'category-images' AND public.is_admin());

-- brand-logos (public)
CREATE POLICY "Public can view brand logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

CREATE POLICY "Admins can upload brand logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-logos' AND public.is_admin());

CREATE POLICY "Admins can update brand logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-logos' AND public.is_admin())
  WITH CHECK (bucket_id = 'brand-logos' AND public.is_admin());

CREATE POLICY "Admins can delete brand logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-logos' AND public.is_admin());

-- quote-attachments (private)
CREATE POLICY "Users can view own quote attachments storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quote-attachments'
    AND (
      public.is_admin()
      OR public.is_staff_or_admin()
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can upload own quote attachments storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quote-attachments'
    AND (
      public.is_admin()
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can update own quote attachments storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'quote-attachments'
    AND (
      public.is_admin()
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'quote-attachments'
    AND (
      public.is_admin()
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can delete own quote attachments storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'quote-attachments'
    AND (
      public.is_admin()
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- resource-files (private)
CREATE POLICY "Admins can view resource files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resource-files'
    AND (public.is_admin() OR public.is_staff_or_admin())
  );

CREATE POLICY "Admins can upload resource files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resource-files' AND public.is_admin());

CREATE POLICY "Admins can update resource files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resource-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'resource-files' AND public.is_admin());

CREATE POLICY "Admins can delete resource files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resource-files' AND public.is_admin());

-- avatars (public read; users manage own folder)
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- Grants
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.products_search_vector_update() TO service_role;
