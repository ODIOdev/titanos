-- Employer Identification Number on quote requests
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS ein TEXT;
