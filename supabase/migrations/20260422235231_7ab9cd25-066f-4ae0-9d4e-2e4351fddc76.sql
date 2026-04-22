CREATE TABLE public.capacity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  max_per_day integer,
  max_per_window integer,
  overbooking_buffer integer NOT NULL DEFAULT 0,
  weekday_max integer,
  weekend_max integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, service_id)
);
CREATE INDEX idx_capacity_settings_org ON public.capacity_settings(organization_id);
ALTER TABLE public.capacity_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capacity_settings_select" ON public.capacity_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "capacity_settings_insert" ON public.capacity_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "capacity_settings_update" ON public.capacity_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "capacity_settings_delete" ON public.capacity_settings FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_capacity_settings BEFORE UPDATE ON public.capacity_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();