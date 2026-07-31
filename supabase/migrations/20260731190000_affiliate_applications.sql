-- Affiliate program applications: customers apply, admins approve after the
-- purchase threshold is met. One live application per profile.

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  audience TEXT NOT NULL,
  motivation TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
  orders_at_apply INTEGER NOT NULL DEFAULT 0 CHECK (orders_at_apply >= 0),
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status
  ON public.affiliate_applications (status);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_created_at
  ON public.affiliate_applications (created_at DESC);

DROP TRIGGER IF EXISTS affiliate_applications_updated_at
  ON public.affiliate_applications;
CREATE TRIGGER affiliate_applications_updated_at
  BEFORE UPDATE ON public.affiliate_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own affiliate application"
  ON public.affiliate_applications;
CREATE POLICY "Users can read own affiliate application"
  ON public.affiliate_applications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can submit own affiliate application"
  ON public.affiliate_applications;
CREATE POLICY "Users can submit own affiliate application"
  ON public.affiliate_applications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Re-applying after a decline updates the same row; the review columns stay
-- admin-only because customers cannot set status to anything but 'pending'.
DROP POLICY IF EXISTS "Users can update own pending affiliate application"
  ON public.affiliate_applications;
CREATE POLICY "Users can update own pending affiliate application"
  ON public.affiliate_applications FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (public.is_admin() OR (user_id = auth.uid() AND status = 'pending'));

DROP POLICY IF EXISTS "Admins can delete affiliate applications"
  ON public.affiliate_applications;
CREATE POLICY "Admins can delete affiliate applications"
  ON public.affiliate_applications FOR DELETE
  USING (public.is_admin());
