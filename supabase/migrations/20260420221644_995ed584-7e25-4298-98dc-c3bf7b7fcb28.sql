ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS balance_due_cents integer;

CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session
  ON public.invoices(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

ALTER TABLE public.stripe_connect_accounts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';