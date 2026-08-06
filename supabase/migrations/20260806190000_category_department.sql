-- Category department assignment (links category to a merchandise department)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS department TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_department
  ON public.categories (department);

COMMENT ON COLUMN public.categories.department IS
  'Merchandise department this category belongs to (matches products.department values).';
