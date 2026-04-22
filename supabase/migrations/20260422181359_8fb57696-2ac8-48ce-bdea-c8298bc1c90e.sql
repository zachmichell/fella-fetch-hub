-- 1. Add location_id to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id);

-- Backfill from reservation
UPDATE public.invoices i
SET location_id = r.location_id
FROM public.reservations r
WHERE i.reservation_id = r.id
  AND i.location_id IS NULL
  AND r.location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_location_id ON public.invoices(location_id);

-- 2. location_hours table
CREATE TABLE IF NOT EXISTS public.location_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time,
  close_time time,
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, day_of_week)
);

ALTER TABLE public.location_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.location_hours
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.location_hours
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.location_hours
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.location_hours
  FOR DELETE USING (public.is_org_member(organization_id));

CREATE TRIGGER trg_location_hours_updated_at
  BEFORE UPDATE ON public.location_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_location_hours_location ON public.location_hours(location_id);