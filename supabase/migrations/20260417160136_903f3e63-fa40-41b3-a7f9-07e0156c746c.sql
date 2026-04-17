-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE country_enum AS ENUM ('CA', 'US');
CREATE TYPE currency_enum AS ENUM ('CAD', 'USD');
CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'manager', 'staff', 'customer');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'paused');
CREATE TYPE module_enum AS ENUM ('daycare', 'boarding', 'grooming', 'training', 'retail');
CREATE TYPE species_enum AS ENUM ('dog', 'cat', 'other');
CREATE TYPE sex_enum AS ENUM ('M', 'F', 'U');
CREATE TYPE intake_status_enum AS ENUM ('pending_review', 'approved', 'restricted', 'banned');
CREATE TYPE pet_owner_relationship AS ENUM ('primary', 'secondary', 'emergency_only');
CREATE TYPE vaccine_type_enum AS ENUM ('rabies', 'dapp', 'dhpp', 'bordetella', 'lepto', 'lyme', 'influenza', 'fvrcp', 'other');
CREATE TYPE communication_pref AS ENUM ('email', 'sms', 'both');
CREATE TYPE duration_type_enum AS ENUM ('hourly', 'half_day', 'full_day', 'overnight', 'multi_night');
CREATE TYPE reservation_status AS ENUM ('requested', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE reservation_source AS ENUM ('staff_created', 'owner_self_serve');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'overdue', 'void');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('card', 'ach', 'in_person');
CREATE TYPE connect_account_type AS ENUM ('standard', 'express', 'custom');
CREATE TYPE kennel_run_type AS ENUM ('standard', 'large', 'suite', 'indoor', 'outdoor');

-- =========================================================
-- UTILITY: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- CORE: organizations, locations, profiles, memberships
-- =========================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  country country_enum NOT NULL,
  currency currency_enum NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Regina',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  street_address text,
  city text,
  state_province text,
  postal_code text,
  country text,
  timezone text,
  phone text,
  email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_locations_org ON public.locations(organization_id);
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL,
  location_ids uuid[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, organization_id)
);
CREATE INDEX idx_memberships_profile ON public.memberships(profile_id);
CREATE INDEX idx_memberships_org ON public.memberships(organization_id);
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- HELPER: current_org_id() — security definer to avoid RLS recursion
-- =========================================================
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.memberships
  WHERE profile_id = auth.uid() AND active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = auth.uid() AND organization_id = _org_id AND active = true
  );
$$;

-- =========================================================
-- BILLING
-- =========================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscription_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  module module_enum NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_sub_modules_org ON public.subscription_modules(organization_id);
CREATE TRIGGER trg_sub_modules_updated BEFORE UPDATE ON public.subscription_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.stripe_connect_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  account_type connect_account_type NOT NULL DEFAULT 'standard',
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_stripe_connect_org ON public.stripe_connect_accounts(organization_id);
CREATE TRIGGER trg_stripe_connect_updated BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- CUSTOMERS & PETS
-- =========================================================
CREATE TABLE public.owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  street_address text,
  city text,
  state_province text,
  postal_code text,
  communication_preference communication_pref NOT NULL DEFAULT 'email',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_owners_org ON public.owners(organization_id);
CREATE TRIGGER trg_owners_updated BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  species species_enum NOT NULL DEFAULT 'dog',
  breed text,
  sex sex_enum NOT NULL DEFAULT 'U',
  date_of_birth date,
  weight_kg numeric(6,2),
  color text,
  microchip_id text,
  spayed_neutered boolean,
  photo_url text,
  feeding_notes text,
  medication_notes text,
  behavioral_notes text,
  allergies text,
  intake_status intake_status_enum NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_pets_org ON public.pets(organization_id);
CREATE TRIGGER trg_pets_updated BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pet_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  relationship pet_owner_relationship NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pet_id, owner_id)
);
CREATE INDEX idx_pet_owners_org ON public.pet_owners(organization_id);
CREATE INDEX idx_pet_owners_pet ON public.pet_owners(pet_id);
CREATE INDEX idx_pet_owners_owner ON public.pet_owners(owner_id);

CREATE TABLE public.vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_type vaccine_type_enum NOT NULL,
  administered_on date,
  expires_on date,
  document_url text,
  verified boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_vaccinations_org ON public.vaccinations(organization_id);
CREATE INDEX idx_vaccinations_pet ON public.vaccinations(pet_id);
CREATE TRIGGER trg_vaccinations_updated BEFORE UPDATE ON public.vaccinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_emergency_contacts_org ON public.emergency_contacts(organization_id);
CREATE TRIGGER trg_emergency_contacts_updated BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- OPERATIONS
-- =========================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  module module_enum NOT NULL,
  name text NOT NULL,
  description text,
  duration_type duration_type_enum NOT NULL,
  base_price_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_services_org ON public.services(organization_id);
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  primary_owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status reservation_status NOT NULL DEFAULT 'requested',
  source reservation_source NOT NULL DEFAULT 'staff_created',
  notes text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_reservations_org ON public.reservations(organization_id);
CREATE INDEX idx_reservations_start ON public.reservations(start_at);
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reservation_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reservation_id, pet_id)
);
CREATE INDEX idx_reservation_pets_org ON public.reservation_pets(organization_id);

CREATE TABLE public.playgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  capacity integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_playgroups_org ON public.playgroups(organization_id);
CREATE TRIGGER trg_playgroups_updated BEFORE UPDATE ON public.playgroups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.playgroup_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  playgroup_id uuid NOT NULL REFERENCES public.playgroups(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_playgroup_assign_org ON public.playgroup_assignments(organization_id);

CREATE TABLE public.kennel_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  run_type kennel_run_type NOT NULL DEFAULT 'standard',
  capacity integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_kennel_runs_org ON public.kennel_runs(organization_id);
CREATE TRIGGER trg_kennel_runs_updated BEFORE UPDATE ON public.kennel_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.kennel_run_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kennel_run_id uuid NOT NULL REFERENCES public.kennel_runs(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_kennel_assign_org ON public.kennel_run_assignments(organization_id);

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE public.waivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_waivers_org ON public.waivers(organization_id);
CREATE TRIGGER trg_waivers_updated BEFORE UPDATE ON public.waivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.waiver_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waiver_id uuid NOT NULL REFERENCES public.waivers(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  signature_data text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_waiver_sig_org ON public.waiver_signatures(organization_id);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.owners(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_documents_org ON public.documents(organization_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- FINANCIAL
-- =========================================================
CREATE TABLE public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate_basis_points integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_tax_rules_org ON public.tax_rules(organization_id);
CREATE TRIGGER trg_tax_rules_updated BEFORE UPDATE ON public.tax_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owners(id) ON DELETE RESTRICT,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  invoice_number text,
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  currency currency_enum NOT NULL,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL,
  line_total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_lines_org ON public.invoice_lines(organization_id);

CREATE TABLE public.invoice_taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tax_rule_id uuid REFERENCES public.tax_rules(id) ON DELETE SET NULL,
  name text NOT NULL,
  rate_basis_points integer NOT NULL,
  amount_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_taxes_org ON public.invoice_taxes(organization_id);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  currency currency_enum NOT NULL,
  method payment_method_enum NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_payments_org ON public.payments(organization_id);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- AUDIT
-- =========================================================
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_org ON public.activity_log(organization_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);

CREATE TABLE public.stripe_processed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- AUTH TRIGGER: auto-create profile on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgroup_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kennel_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kennel_run_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- memberships
CREATE POLICY "Users read own memberships" ON public.memberships FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users insert own memberships" ON public.memberships FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users update own memberships" ON public.memberships FOR UPDATE USING (profile_id = auth.uid());

-- organizations: members can read; authenticated can insert (their own); members can update
CREATE POLICY "Members read org" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Authenticated create org" ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Members update org" ON public.organizations FOR UPDATE USING (public.is_org_member(id));

-- Tenant isolation policy generator for remaining tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'locations','subscriptions','subscription_modules','stripe_connect_accounts',
    'owners','pets','pet_owners','vaccinations','emergency_contacts',
    'services','reservations','reservation_pets',
    'playgroups','playgroup_assignments','kennel_runs','kennel_run_assignments',
    'waivers','waiver_signatures','documents',
    'tax_rules','invoices','invoice_lines','invoice_taxes','payments','activity_log'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "Tenant isolation select" ON public.%I FOR SELECT USING (public.is_org_member(organization_id));', t
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation insert" ON public.%I FOR INSERT WITH CHECK (public.is_org_member(organization_id));', t
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation update" ON public.%I FOR UPDATE USING (public.is_org_member(organization_id));', t
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation delete" ON public.%I FOR DELETE USING (public.is_org_member(organization_id));', t
    );
  END LOOP;
END $$;

-- stripe_processed_events: service-role only (no policies = no access for anon/authenticated)