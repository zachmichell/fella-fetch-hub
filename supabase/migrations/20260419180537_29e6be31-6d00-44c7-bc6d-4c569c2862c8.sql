ALTER TABLE public.waiver_signatures
  ADD COLUMN IF NOT EXISTS waiver_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS user_agent text;