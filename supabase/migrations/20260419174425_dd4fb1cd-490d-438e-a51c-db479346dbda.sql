-- pet-photos bucket policies (public read, org-scoped write)
CREATE POLICY "Pet photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');

CREATE POLICY "Pet photos org insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Pet photos org update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Pet photos org delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-photos'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

-- vaccination-docs bucket policies (org-scoped read + write)
CREATE POLICY "Vaccination docs org read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vaccination-docs'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Vaccination docs org insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vaccination-docs'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Vaccination docs org update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vaccination-docs'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Vaccination docs org delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vaccination-docs'
  AND public.is_org_member(((storage.foldername(name))[1])::uuid)
);