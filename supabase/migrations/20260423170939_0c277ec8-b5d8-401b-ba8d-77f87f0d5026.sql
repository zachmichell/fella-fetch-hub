CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_system text NOT NULL CHECK (source_system IN ('gingr','petexec','daysmart','other')),
  data_type text NOT NULL CHECK (data_type IN ('owners','pets','vaccinations','reservations')),
  file_name text,
  total_rows integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','mapping','validating','importing','completed','failed')),
  column_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_jobs_org ON public.import_jobs(organization_id, created_at DESC);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view import jobs"
  ON public.import_jobs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can create import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can update import jobs"
  ON public.import_jobs FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can delete import jobs"
  ON public.import_jobs FOR DELETE
  USING (public.is_org_admin(organization_id));

CREATE TRIGGER import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();