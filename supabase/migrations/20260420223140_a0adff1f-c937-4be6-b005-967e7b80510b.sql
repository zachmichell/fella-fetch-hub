-- 1. organizations: add billing status + trial end
DO $$ BEGIN
  CREATE TYPE org_status_enum AS ENUM ('trial', 'active', 'paused', 'past_due', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS status org_status_enum NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Backfill trial_ends_at for existing rows
UPDATE public.organizations
SET trial_ends_at = created_at + interval '30 days'
WHERE trial_ends_at IS NULL;

-- Set default for future inserts
ALTER TABLE public.organizations
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '30 days');

-- 2. subscriptions: add billing tracking columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_checkout_session
  ON public.subscriptions(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- 3. subscription_modules: add per-module price
ALTER TABLE public.subscription_modules
  ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_modules_org_loc_module_unique
  ON public.subscription_modules(organization_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid), module)
  WHERE deleted_at IS NULL;