-- Class types (templates)
CREATE TABLE public.class_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'obedience',
  description text,
  max_enrollment integer NOT NULL DEFAULT 10,
  duration_minutes integer NOT NULL DEFAULT 60,
  price_cents integer NOT NULL DEFAULT 0,
  instructor_user_id uuid,
  schedule_day_of_week smallint, -- 0-6, null if no recurring schedule
  schedule_time time,
  prerequisites text,
  status text NOT NULL DEFAULT 'active', -- active | inactive
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Class instances (scheduled occurrences)
CREATE TABLE public.class_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  class_type_id uuid NOT NULL REFERENCES public.class_types(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  instructor_user_id uuid,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled | cancelled | completed
  notes text,
  auto_generated boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_instances_org_start ON public.class_instances(organization_id, start_at);
CREATE INDEX idx_class_instances_type ON public.class_instances(class_type_id);

-- Enrollments
CREATE TABLE public.class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  class_instance_id uuid NOT NULL REFERENCES public.class_instances(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled', -- enrolled | cancelled | waitlist
  attended boolean,
  payment_status text NOT NULL DEFAULT 'unpaid', -- unpaid | paid | refunded
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  enrolled_by uuid,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_instance_id, pet_id)
);

CREATE INDEX idx_class_enrollments_instance ON public.class_enrollments(class_instance_id);
CREATE INDEX idx_class_enrollments_pet ON public.class_enrollments(pet_id);
CREATE INDEX idx_class_enrollments_owner ON public.class_enrollments(owner_id);

-- Triggers for updated_at
CREATE TRIGGER class_types_set_updated_at BEFORE UPDATE ON public.class_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER class_instances_set_updated_at BEFORE UPDATE ON public.class_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER class_enrollments_set_updated_at BEFORE UPDATE ON public.class_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: class_types
CREATE POLICY "Tenant isolation select" ON public.class_types FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.class_types FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.class_types FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.class_types FOR DELETE USING (is_org_member(organization_id));

-- Owners can read active class types in their org
CREATE POLICY "Owners read active class types" ON public.class_types FOR SELECT USING (
  status = 'active' AND deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.owners o WHERE o.organization_id = class_types.organization_id AND o.profile_id = auth.uid()
  )
);

-- RLS: class_instances
CREATE POLICY "Tenant isolation select" ON public.class_instances FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.class_instances FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.class_instances FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.class_instances FOR DELETE USING (is_org_member(organization_id));

-- Owners can read upcoming class instances in their org
CREATE POLICY "Owners read upcoming instances" ON public.class_instances FOR SELECT USING (
  status = 'scheduled' AND deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.owners o WHERE o.organization_id = class_instances.organization_id AND o.profile_id = auth.uid()
  )
);

-- RLS: class_enrollments
CREATE POLICY "Tenant isolation select" ON public.class_enrollments FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation insert" ON public.class_enrollments FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant isolation update" ON public.class_enrollments FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant isolation delete" ON public.class_enrollments FOR DELETE USING (is_org_member(organization_id));

-- Owners can read their own enrollments
CREATE POLICY "Owners read own enrollments" ON public.class_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = class_enrollments.owner_id AND o.profile_id = auth.uid())
);

-- Owners can self-enroll their own pets
CREATE POLICY "Owners self-enroll" ON public.class_enrollments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = class_enrollments.owner_id AND o.profile_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.pet_owners po JOIN public.owners o2 ON o2.id = po.owner_id
    WHERE po.pet_id = class_enrollments.pet_id AND o2.profile_id = auth.uid()
  )
);

-- Owners can cancel their own enrollments
CREATE POLICY "Owners cancel own enrollments" ON public.class_enrollments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = class_enrollments.owner_id AND o.profile_id = auth.uid())
);