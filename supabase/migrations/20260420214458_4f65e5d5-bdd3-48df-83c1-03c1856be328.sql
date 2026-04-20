-- =========================================
-- pet_traits
-- =========================================
CREATE TABLE public.pet_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  pet_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('temperament','play_style','social','triggers','handling','other')),
  label text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','caution','warning')),
  notes text,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_traits_pet ON public.pet_traits(pet_id);
CREATE INDEX idx_pet_traits_org ON public.pet_traits(organization_id);

ALTER TABLE public.pet_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.pet_traits
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.pet_traits
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.pet_traits
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.pet_traits
  FOR DELETE USING (public.is_org_member(organization_id));

CREATE POLICY "Owners read own pets traits" ON public.pet_traits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners po
      JOIN public.owners o ON o.id = po.owner_id
      WHERE po.pet_id = pet_traits.pet_id
        AND o.profile_id = auth.uid()
    )
  );

CREATE TRIGGER set_pet_traits_updated_at
  BEFORE UPDATE ON public.pet_traits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- incidents
-- =========================================
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid,
  reservation_id uuid,
  incident_type text NOT NULL CHECK (incident_type IN ('bite','fight','injury','escape_attempt','property_damage','behavioral','medical_emergency','other')),
  severity text NOT NULL CHECK (severity IN ('minor','moderate','serious','critical')),
  description text NOT NULL,
  action_taken text,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_notes text,
  follow_up_completed_at timestamptz,
  owner_notified boolean NOT NULL DEFAULT false,
  owner_notified_at timestamptz,
  owner_visible boolean NOT NULL DEFAULT false,
  reported_by uuid,
  incident_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_org ON public.incidents(organization_id);
CREATE INDEX idx_incidents_reservation ON public.incidents(reservation_id);
CREATE INDEX idx_incidents_incident_at ON public.incidents(incident_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.incidents
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.incidents
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.incidents
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.incidents
  FOR DELETE USING (public.is_org_member(organization_id));

CREATE TRIGGER set_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- incident_pets (denormalized organization_id like reservation_pets/pet_owners)
-- =========================================
CREATE TABLE public.incident_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'involved' CHECK (role IN ('involved','instigator','victim','witness')),
  injury_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_pets_incident ON public.incident_pets(incident_id);
CREATE INDEX idx_incident_pets_pet ON public.incident_pets(pet_id);
CREATE INDEX idx_incident_pets_org ON public.incident_pets(organization_id);
CREATE UNIQUE INDEX uq_incident_pets_pair ON public.incident_pets(incident_id, pet_id);

ALTER TABLE public.incident_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation select" ON public.incident_pets
  FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.incident_pets
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.incident_pets
  FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.incident_pets
  FOR DELETE USING (public.is_org_member(organization_id));

-- =========================================
-- Owner-portal incident visibility
-- Owners can read incidents (and the join rows) where owner_visible=true
-- AND one of their pets is involved.
-- =========================================
CREATE POLICY "Owners read visible incidents" ON public.incidents
  FOR SELECT USING (
    owner_visible = true
    AND EXISTS (
      SELECT 1 FROM public.incident_pets ip
      JOIN public.pet_owners po ON po.pet_id = ip.pet_id
      JOIN public.owners o ON o.id = po.owner_id
      WHERE ip.incident_id = incidents.id
        AND o.profile_id = auth.uid()
    )
  );

CREATE POLICY "Owners read pets on visible incidents" ON public.incident_pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_pets.incident_id
        AND i.owner_visible = true
    )
    AND EXISTS (
      SELECT 1 FROM public.pet_owners po
      JOIN public.owners o ON o.id = po.owner_id
      WHERE po.pet_id = incident_pets.pet_id
        AND o.profile_id = auth.uid()
    )
  );