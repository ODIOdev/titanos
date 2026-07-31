-- Product department for catalog organization (left of category in admin form)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS department TEXT;

CREATE INDEX IF NOT EXISTS idx_products_department ON public.products (department);
