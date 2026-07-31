-- Affiliate promo codes: one coupon per customer profile

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_coupons_owner_user_id ON public.coupons (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_affiliate ON public.coupons (is_affiliate);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_promo_code
  ON public.profiles (promo_code)
  WHERE promo_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_affiliate_promo_code(
  p_first_name TEXT,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  suffix TEXT;
  candidate TEXT;
  n INTEGER := 0;
BEGIN
  base := upper(regexp_replace(coalesce(nullif(trim(p_first_name), ''), 'TITAN'), '[^A-Za-z0-9]', '', 'g'));
  IF length(base) < 2 THEN
    base := 'TITAN';
  END IF;
  base := left(base, 6);
  suffix := upper(substr(replace(p_user_id::text, '-', ''), 1, 4));
  candidate := base || '-' || suffix;

  WHILE EXISTS (SELECT 1 FROM public.coupons WHERE code = candidate)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE promo_code = candidate)
  LOOP
    n := n + 1;
    candidate := base || '-' || suffix || n::text;
    IF n > 50 THEN
      candidate := 'TITAN-' || upper(substr(md5(p_user_id::text || clock_timestamp()::text), 1, 6));
      EXIT;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_affiliate_promo_for_profile(p_profile_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing TEXT;
  first_name_val TEXT;
  code TEXT;
  coupon_id UUID;
BEGIN
  SELECT promo_code, first_name
  INTO existing, first_name_val
  FROM public.profiles
  WHERE id = p_profile_id;

  IF existing IS NOT NULL AND length(trim(existing)) > 0 THEN
    RETURN existing;
  END IF;

  code := public.generate_affiliate_promo_code(first_name_val, p_profile_id);

  INSERT INTO public.coupons (
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_uses,
    used_count,
    active,
    owner_user_id,
    is_affiliate
  )
  VALUES (
    code,
    'Affiliate promo code',
    'percent',
    10,
    0,
    NULL,
    0,
    TRUE,
    p_profile_id,
    TRUE
  )
  RETURNING id INTO coupon_id;

  UPDATE public.profiles
  SET promo_code = code,
      affiliate_coupon_id = coupon_id,
      updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    account_status,
    is_owner,
    metadata,
    first_name,
    last_name,
    company,
    phone,
    state,
    postal_code
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(
        trim(
          concat_ws(
            ' ',
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name'
          )
        ),
        ''
      ),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'Customer',
    'approved',
    false,
    '{}'::jsonb,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'company', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'state', ''),
    NULLIF(NEW.raw_user_meta_data->>'postal_code', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
        company = COALESCE(EXCLUDED.company, public.profiles.company),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        state = COALESCE(EXCLUDED.state, public.profiles.state),
        postal_code = COALESCE(EXCLUDED.postal_code, public.profiles.postal_code);

  PERFORM public.ensure_affiliate_promo_for_profile(NEW.id);

  RETURN NEW;
END;
$$;

-- Backfill affiliate codes for existing customers
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id
    FROM public.profiles
    WHERE lower(role) = 'customer'
      AND (promo_code IS NULL OR length(trim(promo_code)) = 0)
  LOOP
    PERFORM public.ensure_affiliate_promo_for_profile(r.id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_affiliate_promo_code(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_affiliate_promo_for_profile(UUID) TO service_role;
