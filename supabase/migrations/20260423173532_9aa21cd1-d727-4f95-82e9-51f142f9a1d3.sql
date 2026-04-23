ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_source text;

ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_source text;

CREATE INDEX IF NOT EXISTS idx_pets_external
  ON public.pets (organization_id, external_source, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_owners_external
  ON public.owners (organization_id, external_source, external_id)
  WHERE external_id IS NOT NULL;