-- 1) Harden create_membership
CREATE OR REPLACE FUNCTION public.create_membership(_org_id uuid, _role membership_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _active_count int;
  _any_existing int;
  _is_admin boolean;
  _new_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT count(*) INTO _active_count
  FROM public.memberships
  WHERE profile_id = _caller AND active = true;

  IF _active_count = 0 THEN
    SELECT count(*) INTO _any_existing
    FROM public.memberships
    WHERE profile_id = _caller AND organization_id = _org_id;

    IF _any_existing > 0 THEN
      RAISE EXCEPTION 'Membership already exists for this organization';
    END IF;

    INSERT INTO public.memberships (profile_id, organization_id, role, active)
    VALUES (_caller, _org_id, 'owner'::membership_role, true)
    RETURNING id INTO _new_id;

    RETURN _new_id;
  END IF;

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
$function$;

-- 2) Lock down memberships UPDATE policy
DROP POLICY IF EXISTS "Users update own memberships" ON public.memberships;

CREATE POLICY "Users update own memberships"
ON public.memberships
FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (
  profile_id = auth.uid()
  AND role = (SELECT role FROM public.memberships m WHERE m.id = memberships.id)
  AND organization_id = (SELECT organization_id FROM public.memberships m WHERE m.id = memberships.id)
  AND profile_id = (SELECT profile_id FROM public.memberships m WHERE m.id = memberships.id)
);

-- 3) Make pet-photos private + org-scoped storage policies
UPDATE storage.buckets SET public = false WHERE id = 'pet-photos';

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual ILIKE '%pet-photos%' OR with_check ILIKE '%pet-photos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Org members can read pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update pet photos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete pet photos" ON storage.objects;

CREATE POLICY "Org members can read pet photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members can upload pet photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members can update pet photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Org members can delete pet photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);
