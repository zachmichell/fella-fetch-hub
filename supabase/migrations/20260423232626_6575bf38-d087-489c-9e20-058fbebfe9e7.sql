-- Custom analytics report templates
CREATE TABLE public.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_templates_org ON public.report_templates(organization_id);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view report templates"
  ON public.report_templates FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members create report templates"
  ON public.report_templates FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members update report templates"
  ON public.report_templates FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "Org members delete report templates"
  ON public.report_templates FOR DELETE
  USING (is_org_member(organization_id));

CREATE TRIGGER set_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();