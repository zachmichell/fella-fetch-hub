-- Track dismissed duplicate pairs so they don't reappear in the dedupe tool
CREATE TABLE public.dismissed_duplicates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('owner', 'pet')),
  record_id_1 uuid NOT NULL,
  record_id_2 uuid NOT NULL,
  dismissed_by uuid REFERENCES public.profiles(id),
  dismissed_at timestamptz NOT NULL DEFAULT now()
);

-- Normalize pair so (a,b) and (b,a) are the same entry
CREATE UNIQUE INDEX dismissed_duplicates_unique_pair
  ON public.dismissed_duplicates (
    organization_id,
    entity_type,
    LEAST(record_id_1, record_id_2),
    GREATEST(record_id_1, record_id_2)
  );

CREATE INDEX dismissed_duplicates_org_type_idx
  ON public.dismissed_duplicates (organization_id, entity_type);

ALTER TABLE public.dismissed_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view dismissed duplicates"
  ON public.dismissed_duplicates FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can dismiss duplicates"
  ON public.dismissed_duplicates FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org admins can remove dismissals"
  ON public.dismissed_duplicates FOR DELETE
  USING (is_org_admin(organization_id));