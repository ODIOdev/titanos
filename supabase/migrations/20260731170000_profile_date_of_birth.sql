-- Date of birth for internal team member records

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
