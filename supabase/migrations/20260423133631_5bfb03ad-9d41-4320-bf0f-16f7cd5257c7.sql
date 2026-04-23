-- Groomers table
CREATE TABLE public.groomers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  commission_rate_percent integer,
  max_appointments_per_day integer NOT NULL DEFAULT 8,
  working_days text[] NOT NULL DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday}',
  bio text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_groomers_org ON public.groomers(organization_id);

ALTER TABLE public.groomers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view groomers"
  ON public.groomers FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert groomers"
  ON public.groomers FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update groomers"
  ON public.groomers FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can delete groomers"
  ON public.groomers FOR DELETE
  USING (is_org_member(organization_id));

CREATE TRIGGER trg_groomers_updated_at
  BEFORE UPDATE ON public.groomers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grooming appointments table
CREATE TABLE public.grooming_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  groomer_id uuid NOT NULL REFERENCES public.groomers(id) ON DELETE RESTRICT,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  estimated_duration_minutes integer NOT NULL DEFAULT 60,
  services_requested text[] NOT NULL DEFAULT '{}',
  price_cents integer NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  check_in_time timestamptz,
  completed_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_grooming_appts_org_date ON public.grooming_appointments(organization_id, appointment_date);
CREATE INDEX idx_grooming_appts_groomer ON public.grooming_appointments(groomer_id);
CREATE INDEX idx_grooming_appts_pet ON public.grooming_appointments(pet_id);

ALTER TABLE public.grooming_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view grooming appointments"
  ON public.grooming_appointments FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can insert grooming appointments"
  ON public.grooming_appointments FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update grooming appointments"
  ON public.grooming_appointments FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can delete grooming appointments"
  ON public.grooming_appointments FOR DELETE
  USING (is_org_member(organization_id));

CREATE TRIGGER trg_grooming_appts_updated_at
  BEFORE UPDATE ON public.grooming_appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();