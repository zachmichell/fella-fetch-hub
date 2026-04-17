-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Explicit deny for stripe_processed_events (service role bypasses RLS)
CREATE POLICY "Deny all client access" ON public.stripe_processed_events
  FOR ALL USING (false) WITH CHECK (false);