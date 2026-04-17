ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS max_pets_per_booking integer;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS checked_in_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS checked_out_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_reason text;

-- Backfill requested_at from created_at for existing rows
UPDATE public.reservations
  SET requested_at = created_at
  WHERE requested_at IS NULL;