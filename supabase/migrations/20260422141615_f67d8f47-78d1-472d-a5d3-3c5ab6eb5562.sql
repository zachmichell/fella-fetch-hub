-- Enums
DO $$ BEGIN
  CREATE TYPE public.suite_type_enum AS ENUM ('standard', 'deluxe', 'presidential');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.suite_status_enum AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Suites table
CREATE TABLE IF NOT EXISTS public.suites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  type public.suite_type_enum NOT NULL DEFAULT 'standard',
  capacity integer NOT NULL DEFAULT 1,
  daily_rate_cents integer NOT NULL DEFAULT 0,
  status public.suite_status_enum NOT NULL DEFAULT 'active',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suites_org ON public.suites(organization_id) WHERE deleted_at IS NULL;

ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.suites
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.suites
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.suites
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.suites
  FOR DELETE USING (public.is_org_member(organization_id));

CREATE TRIGGER set_suites_updated_at
  BEFORE UPDATE ON public.suites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add suite_id to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS suite_id uuid REFERENCES public.suites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_suite ON public.reservations(suite_id) WHERE suite_id IS NOT NULL;