-- Add role column to pet_owners for explicit primary/co-owner labeling
ALTER TABLE public.pet_owners
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'primary';

-- Backfill: keep existing rows as 'primary' (default already does this for new rows;
-- ensure pre-existing rows are also set correctly)
UPDATE public.pet_owners SET role = 'primary' WHERE role IS NULL OR role = '';

-- Constrain to known values
ALTER TABLE public.pet_owners
  DROP CONSTRAINT IF EXISTS pet_owners_role_check;
ALTER TABLE public.pet_owners
  ADD CONSTRAINT pet_owners_role_check CHECK (role IN ('primary', 'co-owner'));

-- Helpful index for "list owners of a pet" queries
CREATE INDEX IF NOT EXISTS idx_pet_owners_pet_role ON public.pet_owners (pet_id, role);