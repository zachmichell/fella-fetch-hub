-- email_settings: per-org email preferences
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_name text,
  reservation_confirmation_enabled boolean NOT NULL DEFAULT true,
  invoice_created_enabled boolean NOT NULL DEFAULT true,
  report_card_published_enabled boolean NOT NULL DEFAULT true,
  waiver_reminder_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email settings"
  ON public.email_settings FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can insert email settings"
  ON public.email_settings FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update email settings"
  ON public.email_settings FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE TRIGGER set_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults for existing orgs
INSERT INTO public.email_settings (organization_id, sender_name)
SELECT id, name FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- email_log: audit trail
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  email_type text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  error_message text,
  message_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_log_org_sent ON public.email_log(organization_id, sent_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view email log"
  ON public.email_log FOR SELECT
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));
-- No INSERT/UPDATE/DELETE policies: only service role (edge function) writes.