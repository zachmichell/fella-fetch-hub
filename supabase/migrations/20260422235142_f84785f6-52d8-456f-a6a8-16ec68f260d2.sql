CREATE TABLE public.reservation_belongings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  condition_notes text,
  status text NOT NULL DEFAULT 'checked_in',
  returned_at timestamptz,
  returned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservation_belongings_res ON public.reservation_belongings(reservation_id);
CREATE INDEX idx_reservation_belongings_org ON public.reservation_belongings(organization_id);
ALTER TABLE public.reservation_belongings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "belongings_staff_select" ON public.reservation_belongings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "belongings_staff_insert" ON public.reservation_belongings FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "belongings_staff_update" ON public.reservation_belongings FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "belongings_staff_delete" ON public.reservation_belongings FOR DELETE USING (is_org_member(organization_id));

CREATE POLICY "belongings_owner_select" ON public.reservation_belongings FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.reservation_pets rp
    JOIN public.pet_owners po ON po.pet_id = rp.pet_id
    JOIN public.owners o ON o.id = po.owner_id
    WHERE rp.reservation_id = reservation_belongings.reservation_id
      AND o.profile_id = auth.uid()
  )
);

CREATE TRIGGER set_updated_at_reservation_belongings BEFORE UPDATE ON public.reservation_belongings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();