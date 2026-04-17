-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Users insert own memberships" ON public.memberships;

-- Block direct inserts; all inserts must go through the SECURITY DEFINER function
CREATE POLICY "No direct membership inserts"
ON public.memberships
FOR INSERT
WITH CHECK (false);

-- Function: create a membership safely
CREATE OR REPLACE FUNCTION public.create_membership(
  _org_id uuid,
  _role public.membership_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _existing_count int;
  _is_admin boolean;
  _new_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT count(*) INTO _existing_count
  FROM public.memberships
  WHERE profile_id = _caller AND active = true;

  -- Onboarding path: caller has no active memberships, may create their own as owner
  IF _existing_count = 0 THEN
    IF _caller IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Invalid caller';
    END IF;

    INSERT INTO public.memberships (profile_id, organization_id, role, active)
    VALUES (_caller, _org_id, _role, true)
    RETURNING id INTO _new_id;

    RETURN _new_id;
  END IF;

  -- Otherwise: caller must be owner/admin of the target org to add anyone (including self)
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE profile_id = _caller
      AND organization_id = _org_id
      AND active = true
      AND role IN ('owner', 'admin')
  ) INTO _is_admin;

  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Insufficient permissions to create membership';
  END IF;

  INSERT INTO public.memberships (profile_id, organization_id, role, active)
  VALUES (_caller, _org_id, _role, true)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_membership(uuid, public.membership_role) TO authenticated;