CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('slack','hubspot','shopify','wordpress','calendly','whatsapp')),
  config jsonb DEFAULT '{}',
  is_enabled boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_chatbot_provider ON public.integrations(chatbot_id, provider);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chatbot integrations"
  ON public.integrations
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()))
  WITH CHECK (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));
