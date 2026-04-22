-- loyalty_settings
CREATE TABLE public.loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  points_per_dollar numeric NOT NULL DEFAULT 1,
  redemption_points integer NOT NULL DEFAULT 100,
  redemption_value_cents integer NOT NULL DEFAULT 500,
  referral_bonus_points integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_settings_select" ON public.loyalty_settings FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "loyalty_settings_insert" ON public.loyalty_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "loyalty_settings_update" ON public.loyalty_settings FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "loyalty_settings_delete" ON public.loyalty_settings FOR DELETE USING (is_org_admin(organization_id));
CREATE TRIGGER set_updated_at_loyalty_settings BEFORE UPDATE ON public.loyalty_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- loyalty_rewards
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_rewards_org ON public.loyalty_rewards(organization_id);
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_rewards_select" ON public.loyalty_rewards FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "loyalty_rewards_insert" ON public.loyalty_rewards FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "loyalty_rewards_update" ON public.loyalty_rewards FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "loyalty_rewards_delete" ON public.loyalty_rewards FOR DELETE USING (is_org_member(organization_id));
CREATE TRIGGER set_updated_at_loyalty_rewards BEFORE UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- loyalty_transactions
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'earned',
  description text,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  reward_id uuid REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_tx_owner ON public.loyalty_transactions(owner_id, created_at DESC);
CREATE INDEX idx_loyalty_tx_org ON public.loyalty_transactions(organization_id, created_at DESC);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_tx_staff_select" ON public.loyalty_transactions FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "loyalty_tx_staff_insert" ON public.loyalty_transactions FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "loyalty_tx_staff_update" ON public.loyalty_transactions FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "loyalty_tx_staff_delete" ON public.loyalty_transactions FOR DELETE USING (is_org_member(organization_id));
CREATE POLICY "loyalty_tx_owner_select" ON public.loyalty_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.owners o WHERE o.id = loyalty_transactions.owner_id AND o.profile_id = auth.uid())
);

-- owner_tags (staff-assigned labels)
CREATE TABLE public.owner_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#CBA48F',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_owner_tags_owner ON public.owner_tags(owner_id);
ALTER TABLE public.owner_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_tags_select" ON public.owner_tags FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "owner_tags_insert" ON public.owner_tags FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "owner_tags_update" ON public.owner_tags FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "owner_tags_delete" ON public.owner_tags FOR DELETE USING (is_org_member(organization_id));

-- owners: add referral + loyalty fields
ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referred_by_owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_points integer NOT NULL DEFAULT 0;