-- 1) services.time_windows
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS time_windows jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) staff_notices table
CREATE TABLE public.staff_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  notice_date date NOT NULL,
  title text NOT NULL,
  body text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_notices_org_date ON public.staff_notices(organization_id, notice_date);

ALTER TABLE public.staff_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_notices_select" ON public.staff_notices
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "staff_notices_insert" ON public.staff_notices
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "staff_notices_update" ON public.staff_notices
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "staff_notices_delete" ON public.staff_notices
  FOR DELETE USING (is_org_member(organization_id));

CREATE TRIGGER set_updated_at_staff_notices BEFORE UPDATE ON public.staff_notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();