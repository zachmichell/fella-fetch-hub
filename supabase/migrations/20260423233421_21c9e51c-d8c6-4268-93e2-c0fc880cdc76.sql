-- Staff codes table
CREATE TABLE public.staff_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  pin_code text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','admin','manager','staff','groomer')),
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, pin_code)
);

CREATE INDEX idx_staff_codes_org ON public.staff_codes(organization_id);
CREATE INDEX idx_staff_codes_active ON public.staff_codes(organization_id, is_active);

ALTER TABLE public.staff_codes ENABLE ROW LEVEL SECURITY;

-- View: any active org member
CREATE POLICY "Org members can view staff codes"
ON public.staff_codes FOR SELECT
USING (is_org_member(organization_id));

-- Insert/update/delete: only org admins
CREATE POLICY "Org admins can insert staff codes"
ON public.staff_codes FOR INSERT
WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Org admins can update staff codes"
ON public.staff_codes FOR UPDATE
USING (is_org_admin(organization_id))
WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Org admins can delete staff codes"
ON public.staff_codes FOR DELETE
USING (is_org_admin(organization_id));

-- updated_at trigger
CREATE TRIGGER set_staff_codes_updated_at
BEFORE UPDATE ON public.staff_codes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();