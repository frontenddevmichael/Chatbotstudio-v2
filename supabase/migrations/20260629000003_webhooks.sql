-- Webhook endpoints for outbound event delivery
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text DEFAULT gen_random_uuid()::text,
  events text[] DEFAULT '{message.created,conversation.created}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_sent_at timestamptz,
  last_error text,
  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage webhooks for own chatbots"
  ON public.webhook_endpoints
  FOR ALL
  TO authenticated
  USING (
    chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())
  )
  WITH CHECK (
    chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_chatbot_id ON public.webhook_endpoints(chatbot_id);
