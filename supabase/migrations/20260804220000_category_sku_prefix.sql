-- Category SKU prefix override (defaults derived from category name initials).
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sku_prefix TEXT;

COMMENT ON COLUMN public.categories.sku_prefix IS
  'Optional SKU abbreviation override, e.g. WGG for WGG-0001. When null, derived from category name initials.';
