-- cancellation_policies (default = service_id NULL; one default per org)
CREATE TABLE public.cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  free_cancel_hours integer NOT NULL DEFAULT 24,
  late_cancel_fee_type text NOT NULL DEFAULT 'percentage',
  late_cancel_fee_value numeric NOT NULL DEFAULT 50,
  noshow_fee_type text NOT NULL DEFAULT 'percentage',
  noshow_fee_value numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cancel_policy_default ON public.cancellation_policies(organization_id) WHERE service_id IS NULL;
CREATE UNIQUE INDEX idx_cancel_policy_service ON public.cancellation_policies(organization_id, service_id) WHERE service_id IS NOT NULL;
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancel_policy_select" ON public.cancellation_policies FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "cancel_policy_insert" ON public.cancellation_policies FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "cancel_policy_update" ON public.cancellation_policies FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "cancel_policy_delete" ON public.cancellation_policies FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_cancel_policy BEFORE UPDATE ON public.cancellation_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- cancellation_reasons
CREATE TABLE public.cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cancel_reasons_org ON public.cancellation_reasons(organization_id);
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancel_reasons_select" ON public.cancellation_reasons FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "cancel_reasons_insert" ON public.cancellation_reasons FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "cancel_reasons_update" ON public.cancellation_reasons FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "cancel_reasons_delete" ON public.cancellation_reasons FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_cancel_reasons BEFORE UPDATE ON public.cancellation_reasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- refund_reasons
CREATE TABLE public.refund_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refund_reasons_org ON public.refund_reasons(organization_id);
ALTER TABLE public.refund_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refund_reasons_select" ON public.refund_reasons FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "refund_reasons_insert" ON public.refund_reasons FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "refund_reasons_update" ON public.refund_reasons FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "refund_reasons_delete" ON public.refund_reasons FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_refund_reasons BEFORE UPDATE ON public.refund_reasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tracking columns
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS cancellation_reason_id uuid REFERENCES public.cancellation_reasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_notes text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refund_reason_id uuid REFERENCES public.refund_reasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_notes text;

-- Seed default cancellation reasons per org
INSERT INTO public.cancellation_reasons (organization_id, name, is_default, sort_order)
SELECT o.id, r.name, true, r.sort_order
FROM public.organizations o
CROSS JOIN (VALUES
  ('Owner Request', 1),
  ('Schedule Change', 2),
  ('Pet Illness', 3),
  ('Weather', 4),
  ('Staff Cancellation', 5),
  ('Facility Issue', 6),
  ('Behavioral', 7),
  ('Financial', 8),
  ('No Show', 9),
  ('Other', 10)
) AS r(name, sort_order)
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.cancellation_reasons cr
    WHERE cr.organization_id = o.id AND cr.name = r.name
  );

-- Seed default refund reasons per org
INSERT INTO public.refund_reasons (organization_id, name, is_default, sort_order)
SELECT o.id, r.name, true, r.sort_order
FROM public.organizations o
CROSS JOIN (VALUES
  ('Cancellation', 1),
  ('Service Issue', 2),
  ('Overcharge', 3),
  ('Duplicate Payment', 4),
  ('Customer Complaint', 5),
  ('Owner Credit', 6),
  ('Other', 7)
) AS r(name, sort_order)
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.refund_reasons rr
    WHERE rr.organization_id = o.id AND rr.name = r.name
  );