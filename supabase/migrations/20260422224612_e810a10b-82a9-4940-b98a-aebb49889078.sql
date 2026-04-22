-- Recurring reservation groups
CREATE TABLE public.recurring_reservation_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  pet_ids uuid[] NOT NULL DEFAULT '{}',
  service_id uuid,
  location_id uuid,
  suite_id uuid,
  start_time time NOT NULL,
  end_time time NOT NULL,
  days_of_week smallint[] NOT NULL DEFAULT '{}',
  start_date date NOT NULL,
  end_date date,
  max_occurrences integer,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_reservation_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.recurring_reservation_groups
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.recurring_reservation_groups
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.recurring_reservation_groups
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.recurring_reservation_groups
  FOR DELETE USING (is_org_member(organization_id));

CREATE TRIGGER trg_rrg_updated_at
  BEFORE UPDATE ON public.recurring_reservation_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link reservations to recurring groups
ALTER TABLE public.reservations
  ADD COLUMN recurring_group_id uuid REFERENCES public.recurring_reservation_groups(id) ON DELETE SET NULL,
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;

CREATE INDEX idx_reservations_recurring_group ON public.reservations(recurring_group_id) WHERE recurring_group_id IS NOT NULL;
CREATE INDEX idx_rrg_org_status ON public.recurring_reservation_groups(organization_id, status);