-- call_logs
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  phone text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound',
  staff_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  call_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  notes text,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_call_logs_org_date ON public.call_logs(organization_id, call_at DESC);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_logs_select" ON public.call_logs FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "call_logs_insert" ON public.call_logs FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "call_logs_update" ON public.call_logs FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "call_logs_delete" ON public.call_logs FOR DELETE USING (is_org_member(organization_id));
CREATE TRIGGER set_updated_at_call_logs BEFORE UPDATE ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- message_templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_templates_org ON public.message_templates(organization_id);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_templates_select" ON public.message_templates FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "message_templates_insert" ON public.message_templates FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "message_templates_update" ON public.message_templates FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "message_templates_delete" ON public.message_templates FOR DELETE USING (is_org_member(organization_id));
CREATE TRIGGER set_updated_at_message_templates BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto_reply_settings
CREATE TABLE public.auto_reply_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT 'Thanks for your message! We are currently closed and will get back to you during business hours.',
  business_hours_start time NOT NULL DEFAULT '09:00',
  business_hours_end time NOT NULL DEFAULT '17:00',
  active_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  timezone text NOT NULL DEFAULT 'America/Regina',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auto_reply_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_reply_select" ON public.auto_reply_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "auto_reply_insert" ON public.auto_reply_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "auto_reply_update" ON public.auto_reply_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "auto_reply_delete" ON public.auto_reply_settings FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_auto_reply BEFORE UPDATE ON public.auto_reply_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- survey_settings (config for auto-send survey)
CREATE TABLE public.survey_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  send_hours_after_checkout integer NOT NULL DEFAULT 4,
  feedback_prompt text NOT NULL DEFAULT 'How was your visit?',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_settings_select" ON public.survey_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "survey_settings_insert" ON public.survey_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "survey_settings_update" ON public.survey_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "survey_settings_delete" ON public.survey_settings FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_survey_settings BEFORE UPDATE ON public.survey_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- survey_responses
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  rating integer,
  would_recommend boolean,
  feedback text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_survey_responses_org ON public.survey_responses(organization_id, sent_at DESC);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_responses_staff_select" ON public.survey_responses FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "survey_responses_staff_insert" ON public.survey_responses FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "survey_responses_staff_update" ON public.survey_responses FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "survey_responses_staff_delete" ON public.survey_responses FOR DELETE USING (is_org_member(organization_id));
CREATE POLICY "survey_responses_owner_select" ON public.survey_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = survey_responses.owner_id AND o.profile_id = auth.uid())
);
CREATE POLICY "survey_responses_owner_update" ON public.survey_responses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = survey_responses.owner_id AND o.profile_id = auth.uid())
);
CREATE TRIGGER set_updated_at_survey_responses BEFORE UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();