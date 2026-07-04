CREATE TABLE IF NOT EXISTS public.orchestration_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name text,
  condition_type text NOT NULL CHECK (condition_type IN ('keyword', 'persona', 'sentiment', 'always')),
  condition_value text,
  target_chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orchestration_rules_chatbot_id ON public.orchestration_rules(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_rules_target ON public.orchestration_rules(target_chatbot_id);

CREATE TABLE IF NOT EXISTS public.conversation_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  from_chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  to_chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_transfers_conversation_id ON public.conversation_transfers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_from ON public.conversation_transfers(from_chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_to ON public.conversation_transfers(to_chatbot_id);

ALTER TABLE public.orchestration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orchestration rules for own chatbots"
  ON public.orchestration_rules
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()))
  WITH CHECK (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));

CREATE POLICY "Users can view transfers for own chatbots"
  ON public.conversation_transfers
  FOR SELECT
  TO authenticated
  USING (from_chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()) OR to_chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert transfers"
  ON public.conversation_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (from_chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));
