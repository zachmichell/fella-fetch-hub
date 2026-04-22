-- precheck_settings: per-org configuration
CREATE TABLE public.precheck_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  hours_before integer NOT NULL DEFAULT 24,
  questions jsonb NOT NULL DEFAULT '{
    "wellness": true,
    "new_medications": true,
    "feeding_instructions": true,
    "emergency_contact_changes": true,
    "special_requests": true,
    "recent_incidents": true
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.precheck_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precheck_settings_select" ON public.precheck_settings
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "precheck_settings_insert" ON public.precheck_settings
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "precheck_settings_update" ON public.precheck_settings
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "precheck_settings_delete" ON public.precheck_settings
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_updated_at_precheck_settings BEFORE UPDATE ON public.precheck_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- precheck_submissions: owner-submitted forms
CREATE TABLE public.precheck_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_precheck_submissions_reservation ON public.precheck_submissions(reservation_id);
CREATE INDEX idx_precheck_submissions_org ON public.precheck_submissions(organization_id);
CREATE UNIQUE INDEX idx_precheck_submissions_unique_per_reservation
  ON public.precheck_submissions(reservation_id);

ALTER TABLE public.precheck_submissions ENABLE ROW LEVEL SECURITY;

-- Staff: full access in their org
CREATE POLICY "precheck_submissions_staff_select" ON public.precheck_submissions
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "precheck_submissions_staff_insert" ON public.precheck_submissions
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "precheck_submissions_staff_update" ON public.precheck_submissions
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "precheck_submissions_staff_delete" ON public.precheck_submissions
  FOR DELETE USING (is_org_member(organization_id));

-- Owners: select + insert/update for their own owner record
CREATE POLICY "precheck_submissions_owner_select" ON public.precheck_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = precheck_submissions.owner_id
        AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "precheck_submissions_owner_insert" ON public.precheck_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = precheck_submissions.owner_id
        AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "precheck_submissions_owner_update" ON public.precheck_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = precheck_submissions.owner_id
        AND o.profile_id = auth.uid()
    )
  );

CREATE TRIGGER set_updated_at_precheck_submissions BEFORE UPDATE ON public.precheck_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();