-- Live profiles.role check allows: Customer | Administrator | Support
-- Keep signup trigger aligned; app filters roles case-insensitively.

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
  RETURN NEW;
END;
$$;

-- Admin RLS helpers must recognize live role labels
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
      AND (
        lower(role) IN ('admin', 'administrator')
        OR is_owner = TRUE
      )
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
      AND (
        lower(role) IN ('staff', 'support', 'admin', 'administrator')
        OR is_owner = TRUE
      )
  );
$$;
