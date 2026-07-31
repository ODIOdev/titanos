-- Role-based affiliate promo discount rates, editable from /admin/members

INSERT INTO public.site_settings (key, value)
VALUES ('promo_discounts', '{"customer": 10, "admin": 15}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.affiliate_discount_percent_for_role(p_role TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cfg JSONB;
  role_key TEXT;
  pct NUMERIC;
BEGIN
  role_key := CASE
    WHEN lower(coalesce(p_role, '')) IN ('admin', 'administrator') THEN 'admin'
    ELSE 'customer'
  END;

  SELECT value INTO cfg
  FROM public.site_settings
  WHERE key = 'promo_discounts';

  pct := NULLIF(cfg->>role_key, '')::NUMERIC;

  IF pct IS NULL OR pct < 0 OR pct > 100 THEN
    pct := 10;
  END IF;

  RETURN pct;
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
  role_val TEXT;
  code TEXT;
  coupon_id UUID;
BEGIN
  SELECT promo_code, first_name, role
  INTO existing, first_name_val, role_val
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
    public.affiliate_discount_percent_for_role(role_val),
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

GRANT EXECUTE ON FUNCTION public.affiliate_discount_percent_for_role(TEXT) TO service_role;
