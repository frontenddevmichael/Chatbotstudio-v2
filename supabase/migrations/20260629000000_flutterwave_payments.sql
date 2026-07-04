-- Add payment columns to profiles for Flutterwave integration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_customer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT NULL;

-- Rename stripe_customer_id to flutterwave_customer_id for clarity
ALTER TABLE public.profiles RENAME COLUMN stripe_customer_id TO flutterwave_customer_id;

-- Flutterwave webhook events table
CREATE TABLE IF NOT EXISTS public.flutterwave_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  transaction_id text,
  tx_ref text,
  amount numeric,
  currency text,
  status text,
  customer_email text,
  customer_name text,
  raw_body jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.flutterwave_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage flutterwave events"
  ON public.flutterwave_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
