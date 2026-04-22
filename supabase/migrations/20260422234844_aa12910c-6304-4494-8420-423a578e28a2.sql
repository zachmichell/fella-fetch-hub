-- breeds
CREATE TABLE public.breeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL DEFAULT 'dog',
  size_category text,
  avg_weight_min numeric,
  avg_weight_max numeric,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_breeds_org ON public.breeds(organization_id, species);
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breeds_select" ON public.breeds FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "breeds_insert" ON public.breeds FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "breeds_update" ON public.breeds FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "breeds_delete" ON public.breeds FOR DELETE USING (is_org_member(organization_id));
CREATE TRIGGER set_updated_at_breeds BEFORE UPDATE ON public.breeds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- veterinarians
CREATE TABLE public.veterinarians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  clinic_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_veterinarians_org ON public.veterinarians(organization_id);
ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vets_select" ON public.veterinarians FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "vets_insert" ON public.veterinarians FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "vets_update" ON public.veterinarians FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "vets_delete" ON public.veterinarians FOR DELETE USING (is_org_member(organization_id));
CREATE TRIGGER set_updated_at_veterinarians BEFORE UPDATE ON public.veterinarians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pets: add new optional columns
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS breed_id uuid REFERENCES public.breeds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vet_id uuid REFERENCES public.veterinarians(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deactivation_reason text,
  ADD COLUMN IF NOT EXISTS deactivation_notes text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Seed common breeds for every existing org
INSERT INTO public.breeds (organization_id, name, species, size_category)
SELECT o.id, b.name, b.species, b.size_category
FROM public.organizations o
CROSS JOIN (VALUES
  ('Labrador Retriever','dog','large'),
  ('Golden Retriever','dog','large'),
  ('German Shepherd','dog','large'),
  ('French Bulldog','dog','small'),
  ('Poodle','dog','medium'),
  ('Beagle','dog','small'),
  ('Rottweiler','dog','large'),
  ('Bulldog','dog','medium'),
  ('Dachshund','dog','small'),
  ('Yorkshire Terrier','dog','toy'),
  ('Boxer','dog','large'),
  ('Siberian Husky','dog','large'),
  ('Great Dane','dog','giant'),
  ('Shih Tzu','dog','small'),
  ('Chihuahua','dog','toy'),
  ('Mixed Breed','dog',NULL),
  ('Other','dog',NULL),
  ('Domestic Shorthair','cat','medium'),
  ('Domestic Longhair','cat','medium'),
  ('Persian','cat','medium'),
  ('Siamese','cat','medium'),
  ('Maine Coon','cat','large'),
  ('Ragdoll','cat','large'),
  ('Bengal','cat','medium'),
  ('Mixed Breed','cat',NULL),
  ('Other','cat',NULL)
) AS b(name, species, size_category)
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.breeds br
    WHERE br.organization_id = o.id AND br.name = b.name AND br.species = b.species
  );