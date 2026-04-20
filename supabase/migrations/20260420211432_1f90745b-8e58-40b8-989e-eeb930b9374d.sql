-- ============================================================
-- Pet Care Logs, Medications, Feeding & Report Cards
-- (Order: medications, feeding, report_cards, then care_logs
--  so the care_logs RLS policy can reference report_cards)
-- ============================================================

-- 1) pet_medications
CREATE TABLE public.pet_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text,
  timing text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_medications_pet ON public.pet_medications(pet_id) WHERE is_active = true;
CREATE INDEX idx_pet_medications_org ON public.pet_medications(organization_id);

ALTER TABLE public.pet_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.pet_medications FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.pet_medications FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.pet_medications FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.pet_medications FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners read own pets meds" ON public.pet_medications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pet_owners po
    JOIN public.owners o ON o.id = po.owner_id
    WHERE po.pet_id = pet_medications.pet_id
      AND o.profile_id = auth.uid()
  )
);

CREATE TRIGGER trg_pet_medications_updated BEFORE UPDATE ON public.pet_medications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) pet_feeding_schedules
CREATE TABLE public.pet_feeding_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  food_type text NOT NULL,
  amount text,
  frequency text,
  timing text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_feeding_pet ON public.pet_feeding_schedules(pet_id) WHERE is_active = true;
CREATE INDEX idx_pet_feeding_org ON public.pet_feeding_schedules(organization_id);

ALTER TABLE public.pet_feeding_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.pet_feeding_schedules FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.pet_feeding_schedules FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.pet_feeding_schedules FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.pet_feeding_schedules FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners read own pets feeding" ON public.pet_feeding_schedules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pet_owners po
    JOIN public.owners o ON o.id = po.owner_id
    WHERE po.pet_id = pet_feeding_schedules.pet_id
      AND o.profile_id = auth.uid()
  )
);

CREATE TRIGGER trg_pet_feeding_updated BEFORE UPDATE ON public.pet_feeding_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) report_cards (created BEFORE pet_care_logs so policies can reference it)
CREATE TABLE public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  overall_rating text CHECK (overall_rating IN ('excellent','good','fair','needs_attention')),
  summary text,
  mood text CHECK (mood IN ('happy','playful','calm','anxious','tired')),
  energy_level text CHECK (energy_level IN ('high','medium','low')),
  appetite text CHECK (appetite IN ('ate_all','ate_some','ate_little','refused')),
  sociability text CHECK (sociability IN ('very_social','social','selective','kept_to_self')),
  photo_urls text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, pet_id)
);
CREATE INDEX idx_report_cards_org ON public.report_cards(organization_id);
CREATE INDEX idx_report_cards_pet ON public.report_cards(pet_id);
CREATE INDEX idx_report_cards_published ON public.report_cards(published, published_at DESC);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.report_cards FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.report_cards FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.report_cards FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.report_cards FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners read published cards" ON public.report_cards FOR SELECT USING (
  published = true
  AND EXISTS (
    SELECT 1 FROM public.pet_owners po
    JOIN public.owners o ON o.id = po.owner_id
    WHERE po.pet_id = report_cards.pet_id
      AND o.profile_id = auth.uid()
  )
);

CREATE TRIGGER trg_report_cards_updated BEFORE UPDATE ON public.report_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) pet_care_logs
CREATE TABLE public.pet_care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  log_type text NOT NULL CHECK (log_type IN ('feeding','medication','potty','play','rest','note')),
  reference_id uuid,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  logged_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_care_logs_pet_date ON public.pet_care_logs(pet_id, logged_at DESC);
CREATE INDEX idx_care_logs_reservation ON public.pet_care_logs(reservation_id);
CREATE INDEX idx_care_logs_org_date ON public.pet_care_logs(organization_id, logged_at DESC);

ALTER TABLE public.pet_care_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.pet_care_logs FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.pet_care_logs FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.pet_care_logs FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.pet_care_logs FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners read logs after publish" ON public.pet_care_logs FOR SELECT USING (
  reservation_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.report_cards rc
    JOIN public.pet_owners po ON po.pet_id = rc.pet_id
    JOIN public.owners o ON o.id = po.owner_id
    WHERE rc.pet_id = pet_care_logs.pet_id
      AND rc.reservation_id = pet_care_logs.reservation_id
      AND rc.published = true
      AND o.profile_id = auth.uid()
  )
);

-- 5) Storage bucket for report card photos
INSERT INTO storage.buckets (id, name, public) VALUES ('report-card-photos', 'report-card-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read report card photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-card-photos');

CREATE POLICY "Org members upload report card photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-card-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members update report card photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'report-card-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members delete report card photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'report-card-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);
