-- Add color to playgroups
ALTER TABLE public.playgroups
  ADD COLUMN color text NOT NULL DEFAULT '#CBA48F';

-- Add daily rate modifier (cents) to kennel_runs
ALTER TABLE public.kennel_runs
  ADD COLUMN daily_rate_modifier_cents integer NOT NULL DEFAULT 0;

-- Track who assigned a pet to a playgroup / kennel run
ALTER TABLE public.playgroup_assignments
  ADD COLUMN assigned_by_user_id uuid;

ALTER TABLE public.kennel_run_assignments
  ADD COLUMN assigned_by_user_id uuid;