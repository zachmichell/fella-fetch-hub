-- Restore public read on pet-photos bucket (intentional product decision).
-- Writes remain locked to org members via the policies created earlier.
UPDATE storage.buckets SET public = true WHERE id = 'pet-photos';

-- Replace the org-scoped SELECT policy with a public-read policy for this bucket.
DROP POLICY IF EXISTS "Org members can read pet photos" ON storage.objects;

CREATE POLICY "Public read pet photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');
