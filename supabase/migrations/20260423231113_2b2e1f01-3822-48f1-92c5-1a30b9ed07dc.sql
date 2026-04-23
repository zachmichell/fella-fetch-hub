-- 1. Tip columns
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS tip_cents integer;

ALTER TABLE public.grooming_appointments
  ADD COLUMN IF NOT EXISTS tip_cents integer;

-- 2. Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  card_brand text NOT NULL,
  card_last_four text NOT NULL,
  expiry_month integer NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year integer NOT NULL CHECK (expiry_year BETWEEN 2000 AND 2100),
  is_default boolean NOT NULL DEFAULT false,
  stripe_payment_method_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_owner ON public.payment_methods(owner_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON public.payment_methods(organization_id);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Org members can insert payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Org members can update payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Org members can delete payment methods" ON public.payment_methods;

CREATE POLICY "Org members can view payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (public.is_org_member(organization_id));

-- updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_payment_methods ON public.payment_methods;
CREATE TRIGGER set_updated_at_payment_methods
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Ensure only one default per owner
CREATE UNIQUE INDEX IF NOT EXISTS uniq_default_payment_method_per_owner
  ON public.payment_methods(owner_id)
  WHERE is_default;
