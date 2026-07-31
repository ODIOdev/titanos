-- Bulk re-rate affiliate promo codes by role, in one statement.
-- coupons.discount_value has a CHECK (> 0), so rates must stay above zero.

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

  IF pct IS NULL OR pct <= 0 OR pct > 100 THEN
    pct := 10;
  END IF;

  RETURN pct;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_affiliate_discounts(
  p_customer_percent NUMERIC,
  p_admin_percent NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated INTEGER;
BEGIN
  IF p_customer_percent <= 0 OR p_customer_percent > 100
     OR p_admin_percent <= 0 OR p_admin_percent > 100 THEN
    RAISE EXCEPTION 'Discount percentages must be greater than 0 and at most 100';
  END IF;

  UPDATE public.coupons c
  SET discount_type = 'percent',
      discount_value = CASE
        WHEN lower(coalesce(p.role, '')) IN ('admin', 'administrator')
          OR p.is_owner = TRUE
        THEN p_admin_percent
        ELSE p_customer_percent
      END,
      updated_at = NOW()
  FROM public.profiles p
  WHERE c.owner_user_id = p.id
    AND c.is_affiliate = TRUE;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_affiliate_discounts(NUMERIC, NUMERIC) TO service_role;
