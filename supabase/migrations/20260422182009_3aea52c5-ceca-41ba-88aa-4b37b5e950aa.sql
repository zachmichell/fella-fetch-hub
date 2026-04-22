-- ============================================================
-- Helper function: is_org_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid()
      AND organization_id = _org_id
      AND active = true
      AND role IN ('owner', 'admin')
  );
$$;

-- ============================================================
-- services: add is_addon and duration_minutes
-- ============================================================
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_addon boolean NOT NULL DEFAULT false;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- ============================================================
-- subscription_packages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'one_time', -- one_time, monthly, quarterly, annual
  included_credits jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"daycare_days": 10, "baths": 5}
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read packages" ON public.subscription_packages
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admins insert packages" ON public.subscription_packages
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admins update packages" ON public.subscription_packages
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admins delete packages" ON public.subscription_packages
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_subscription_packages_updated_at
  BEFORE UPDATE ON public.subscription_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- owner_subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  package_id uuid NOT NULL,
  remaining_credits jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active', -- active, depleted, cancelled
  purchased_at timestamptz NOT NULL DEFAULT now(),
  next_billing_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read owner subs" ON public.owner_subscriptions
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members insert owner subs" ON public.owner_subscriptions
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Org members update owner subs" ON public.owner_subscriptions
  FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Admins delete owner subs" ON public.owner_subscriptions
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_owner_subscriptions_updated_at
  BEFORE UPDATE ON public.owner_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_owner_subs_org_owner ON public.owner_subscriptions(organization_id, owner_id);

-- ============================================================
-- email_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT 'all', -- all, active_clients, lapsed, custom
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft, scheduled, sent
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read campaigns" ON public.email_campaigns
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admins insert campaigns" ON public.email_campaigns
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admins update campaigns" ON public.email_campaigns
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admins delete campaigns" ON public.email_campaigns
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- notification_settings (for SMS/Comms page)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_type text NOT NULL, -- e.g. reservation_reminder, check_in, check_out, etc.
  channel text NOT NULL DEFAULT 'sms', -- sms, email, in_app
  enabled boolean NOT NULL DEFAULT false,
  template_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, event_type, channel)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read notif settings" ON public.notification_settings
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admins insert notif settings" ON public.notification_settings
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admins update notif settings" ON public.notification_settings
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admins delete notif settings" ON public.notification_settings
  FOR DELETE USING (is_org_admin(organization_id));

CREATE TRIGGER set_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Update memberships RLS so admins can edit other members' rows
-- ============================================================
DROP POLICY IF EXISTS "Users update own memberships" ON public.memberships;

CREATE POLICY "Users or admins update memberships" ON public.memberships
  FOR UPDATE
  USING (profile_id = auth.uid() OR is_org_admin(organization_id))
  WITH CHECK (profile_id = auth.uid() OR is_org_admin(organization_id));

-- Allow admins to read all memberships in their org (for User Management page)
DROP POLICY IF EXISTS "Admins read org memberships" ON public.memberships;
CREATE POLICY "Admins read org memberships" ON public.memberships
  FOR SELECT USING (is_org_admin(organization_id));

-- Allow admins to insert pre-invited memberships (uses a separate INSERT policy
-- since the existing "No direct membership inserts" blocks all).
DROP POLICY IF EXISTS "No direct membership inserts" ON public.memberships;
CREATE POLICY "Admins or self via rpc insert memberships" ON public.memberships
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

-- ============================================================
-- pending_invitations table (for pre-invited emails before signup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  UNIQUE(organization_id, email)
);

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read invitations" ON public.pending_invitations
  FOR SELECT USING (is_org_admin(organization_id));
CREATE POLICY "Admins insert invitations" ON public.pending_invitations
  FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "Admins update invitations" ON public.pending_invitations
  FOR UPDATE USING (is_org_admin(organization_id));
CREATE POLICY "Admins delete invitations" ON public.pending_invitations
  FOR DELETE USING (is_org_admin(organization_id));

-- ============================================================
-- Trigger: when a profile is created, consume any pending invitation
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  valid_role membership_role;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  FOR inv IN
    SELECT * FROM public.pending_invitations
    WHERE lower(email) = lower(NEW.email)
      AND consumed_at IS NULL
  LOOP
    BEGIN
      valid_role := inv.role::membership_role;
    EXCEPTION WHEN others THEN
      valid_role := 'staff'::membership_role;
    END;

    -- Skip if a membership already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.memberships
      WHERE profile_id = NEW.id AND organization_id = inv.organization_id
    ) THEN
      INSERT INTO public.memberships (profile_id, organization_id, role, active)
      VALUES (NEW.id, inv.organization_id, valid_role, true);
    END IF;

    UPDATE public.pending_invitations
    SET consumed_at = now()
    WHERE id = inv.id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consume_pending_invitations ON public.profiles;
CREATE TRIGGER trg_consume_pending_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.consume_pending_invitations();

-- ============================================================
-- RPC: deactivate / reactivate / change role with last-owner protection
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_member_role(_membership_id uuid, _new_role membership_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _current_role membership_role;
  _owner_count int;
BEGIN
  SELECT organization_id, role INTO _org, _current_role
  FROM public.memberships WHERE id = _membership_id;

  IF _org IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF NOT is_org_admin(_org) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _current_role = 'owner' AND _new_role <> 'owner' THEN
    SELECT count(*) INTO _owner_count
    FROM public.memberships
    WHERE organization_id = _org AND role = 'owner' AND active = true;
    IF _owner_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last active owner';
    END IF;
  END IF;

  UPDATE public.memberships SET role = _new_role WHERE id = _membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_active(_membership_id uuid, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _current_role membership_role;
  _owner_count int;
BEGIN
  SELECT organization_id, role INTO _org, _current_role
  FROM public.memberships WHERE id = _membership_id;

  IF _org IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF NOT is_org_admin(_org) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _current_role = 'owner' AND _active = false THEN
    SELECT count(*) INTO _owner_count
    FROM public.memberships
    WHERE organization_id = _org AND role = 'owner' AND active = true;
    IF _owner_count <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last active owner';
    END IF;
  END IF;

  UPDATE public.memberships SET active = _active WHERE id = _membership_id;
END;
$$;