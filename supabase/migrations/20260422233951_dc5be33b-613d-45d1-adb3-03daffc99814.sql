-- Shift templates
CREATE TABLE public.shift_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  color text NOT NULL DEFAULT '#CBA48F',
  department text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_templates_select" ON public.shift_templates
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "shift_templates_insert" ON public.shift_templates
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "shift_templates_update" ON public.shift_templates
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "shift_templates_delete" ON public.shift_templates
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_updated_at_shift_templates BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Staff shifts
CREATE TABLE public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  department text,
  shift_template_id uuid REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_shifts_org_date ON public.staff_shifts(organization_id, shift_date);
CREATE INDEX idx_staff_shifts_user_date ON public.staff_shifts(user_id, shift_date);

ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_shifts_select" ON public.staff_shifts
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "staff_shifts_insert" ON public.staff_shifts
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "staff_shifts_update" ON public.staff_shifts
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "staff_shifts_delete" ON public.staff_shifts
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_updated_at_staff_shifts BEFORE UPDATE ON public.staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Checklist templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  department text,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_select" ON public.checklist_templates
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "checklist_templates_insert" ON public.checklist_templates
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "checklist_templates_update" ON public.checklist_templates
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "checklist_templates_delete" ON public.checklist_templates
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_updated_at_checklist_templates BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Checklist completions (one row per template per date; completed_items tracks per-item state)
CREATE TABLE public.checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  completed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, completion_date)
);

CREATE INDEX idx_checklist_completions_org_date ON public.checklist_completions(organization_id, completion_date);

ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_completions_select" ON public.checklist_completions
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "checklist_completions_insert" ON public.checklist_completions
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "checklist_completions_update" ON public.checklist_completions
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "checklist_completions_delete" ON public.checklist_completions
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_updated_at_checklist_completions BEFORE UPDATE ON public.checklist_completions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();