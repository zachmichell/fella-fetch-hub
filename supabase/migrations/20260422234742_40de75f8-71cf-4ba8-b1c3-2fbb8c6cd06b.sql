-- portal_settings
CREATE TABLE public.portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_url text,
  business_name text,
  primary_color text NOT NULL DEFAULT '#CBA48F',
  welcome_message text NOT NULL DEFAULT 'Welcome to your pet portal!',
  feature_toggles jsonb NOT NULL DEFAULT '{
    "online_booking": true,
    "online_packages": true,
    "view_invoices": true,
    "messaging": true,
    "edit_pets": true,
    "cancel_reservations": true,
    "cancel_lead_time_hours": 24,
    "show_report_cards": true,
    "show_vaccination_reminders": true
  }'::jsonb,
  booking_rules jsonb NOT NULL DEFAULT '{
    "min_advance_hours": 24,
    "max_advance_days": 90,
    "require_vaccinations": true,
    "require_signed_agreement": true
  }'::jsonb,
  lead_form_enabled boolean NOT NULL DEFAULT false,
  lead_form_fields jsonb NOT NULL DEFAULT '{
    "owner_name": true,
    "email": true,
    "phone": true,
    "pet_name": true,
    "pet_breed": true,
    "source": true
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_settings_select" ON public.portal_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "portal_settings_insert" ON public.portal_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "portal_settings_update" ON public.portal_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "portal_settings_delete" ON public.portal_settings FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_portal_settings BEFORE UPDATE ON public.portal_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  pet_name text,
  pet_breed text,
  source text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  converted_owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_org_status ON public.leads(organization_id, status, created_at DESC);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_staff_select" ON public.leads FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "leads_staff_update" ON public.leads FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "leads_staff_delete" ON public.leads FOR DELETE USING (is_org_member(organization_id));
-- Public lead submission: anyone (including anon) can insert
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();