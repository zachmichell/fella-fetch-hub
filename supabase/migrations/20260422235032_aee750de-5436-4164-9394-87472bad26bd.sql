CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  applies_to_services uuid[] NOT NULL DEFAULT '{}',
  start_date date,
  end_date date,
  priority integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pricing_rules_org ON public.pricing_rules(organization_id, priority);
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_rules_select" ON public.pricing_rules FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "pricing_rules_insert" ON public.pricing_rules FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "pricing_rules_update" ON public.pricing_rules FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "pricing_rules_delete" ON public.pricing_rules FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_pricing_rules BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();