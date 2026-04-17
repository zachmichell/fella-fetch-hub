-- Add missing columns to pets
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS markings text,
  ADD COLUMN IF NOT EXISTS temperament_tags text[] NOT NULL DEFAULT '{}';

-- Add missing columns to vaccinations
ALTER TABLE public.vaccinations
  ADD COLUMN IF NOT EXISTS vet_name text,
  ADD COLUMN IF NOT EXISTS vet_clinic text,
  ADD COLUMN IF NOT EXISTS verified_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vaccination-docs', 'vaccination-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Helper: check if path's first folder is an org the user belongs to
-- Path convention: {organization_id}/{pet_id}/{filename}

-- pet-photos policies (public read, org-scoped write)
CREATE POLICY "Pet photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

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

-- vaccination-docs policies (org-scoped for all operations)
CREATE POLICY "Org members can read vaccination docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vaccination-docs'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can upload vaccination docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vaccination-docs'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can update vaccination docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vaccination-docs'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can delete vaccination docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vaccination-docs'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );