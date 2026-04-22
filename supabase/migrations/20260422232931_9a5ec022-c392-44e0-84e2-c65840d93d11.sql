-- ============ DEPOSITS ============

-- Deposit settings (per organization, singleton via UNIQUE)
CREATE TABLE public.deposit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  amount_type text NOT NULL DEFAULT 'percentage', -- 'fixed' | 'percentage'
  default_amount_cents integer NOT NULL DEFAULT 0,
  default_percentage_bp integer NOT NULL DEFAULT 2500, -- basis points (25.00%)
  refund_policy text NOT NULL DEFAULT 'partial', -- 'full' | 'partial' | 'none'
  refund_cutoff_hours integer NOT NULL DEFAULT 48,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Per-service deposit overrides
CREATE TABLE public.service_deposit_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  service_id uuid NOT NULL,
  amount_type text NOT NULL DEFAULT 'percentage',
  amount_cents integer NOT NULL DEFAULT 0,
  percentage_bp integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id)
);

-- Deposits ledger
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reservation_id uuid,
  owner_id uuid NOT NULL,
  pet_id uuid,
  service_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'refunded' | 'forfeited'
  paid_at timestamptz,
  refunded_at timestamptz,
  forfeited_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deposits_org_status ON public.deposits(organization_id, status);
CREATE INDEX idx_deposits_owner ON public.deposits(owner_id);
CREATE INDEX idx_deposits_reservation ON public.deposits(reservation_id);

-- ============ AGREEMENTS ============

-- Agreement templates (replaces simple waivers)
CREATE TABLE public.agreement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'waiver', -- 'waiver' | 'liability' | 'policy' | 'service_agreement'
  body text NOT NULL DEFAULT '',
  required_for text NOT NULL DEFAULT 'all', -- 'all' | 'services' | 'optional'
  required_service_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agreement_templates_org ON public.agreement_templates(organization_id);

-- Signed agreements
CREATE TABLE public.signed_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.agreement_templates(id) ON DELETE CASCADE,
  template_version integer NOT NULL DEFAULT 1,
  owner_id uuid NOT NULL,
  pet_id uuid,
  signature_data text NOT NULL, -- base64 PNG
  signer_name text NOT NULL,
  ip_address text,
  user_agent text,
  rendered_body text NOT NULL DEFAULT '', -- snapshot of body at signing
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signed_agreements_org ON public.signed_agreements(organization_id);
CREATE INDEX idx_signed_agreements_owner ON public.signed_agreements(owner_id);
CREATE INDEX idx_signed_agreements_template ON public.signed_agreements(template_id);

-- ============ TRIGGERS ============
CREATE TRIGGER deposit_settings_set_updated_at BEFORE UPDATE ON public.deposit_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER service_deposit_overrides_set_updated_at BEFORE UPDATE ON public.service_deposit_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER deposits_set_updated_at BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agreement_templates_set_updated_at BEFORE UPDATE ON public.agreement_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS POLICIES ============

-- deposit_settings
CREATE POLICY "Tenant select" ON public.deposit_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admin insert" ON public.deposit_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admin update" ON public.deposit_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admin delete" ON public.deposit_settings FOR DELETE USING (is_org_admin(organization_id));

-- service_deposit_overrides
CREATE POLICY "Tenant select" ON public.service_deposit_overrides FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admin insert" ON public.service_deposit_overrides FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admin update" ON public.service_deposit_overrides FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admin delete" ON public.service_deposit_overrides FOR DELETE USING (is_org_admin(organization_id));

-- deposits
CREATE POLICY "Tenant select" ON public.deposits FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant insert" ON public.deposits FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant update" ON public.deposits FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant delete" ON public.deposits FOR DELETE USING (is_org_member(organization_id));

-- Owners can see their own deposits
CREATE POLICY "Owners read own deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = deposits.owner_id AND o.profile_id = auth.uid())
);

-- agreement_templates
CREATE POLICY "Tenant select" ON public.agreement_templates FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admin insert" ON public.agreement_templates FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admin update" ON public.agreement_templates FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admin delete" ON public.agreement_templates FOR DELETE USING (is_org_admin(organization_id));

-- Owners can read active templates in their org (so they can sign)
CREATE POLICY "Owners read active templates" ON public.agreement_templates FOR SELECT USING (
  status = 'active' AND deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.owners o WHERE o.organization_id = agreement_templates.organization_id AND o.profile_id = auth.uid()
  )
);

-- signed_agreements
CREATE POLICY "Tenant select" ON public.signed_agreements FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Tenant insert" ON public.signed_agreements FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Tenant update" ON public.signed_agreements FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Tenant delete" ON public.signed_agreements FOR DELETE USING (is_org_member(organization_id));

-- Owners can sign on their own behalf
CREATE POLICY "Owners self-sign" ON public.signed_agreements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = signed_agreements.owner_id AND o.profile_id = auth.uid())
);
-- Owners can read their own signed agreements
CREATE POLICY "Owners read own signed" ON public.signed_agreements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = signed_agreements.owner_id AND o.profile_id = auth.uid())
);