CREATE TABLE IF NOT EXISTS public.follow_up_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('no_response', 'after_conversation', 'keyword_detected', 'abandoned_cart')),
  trigger_delay_hours integer DEFAULT 24,
  email_subject text,
  email_body text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_rules_chatbot_id ON public.follow_up_rules(chatbot_id);

CREATE TABLE IF NOT EXISTS public.follow_up_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.follow_up_rules(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  visitor_email text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  status text DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_follow_up_log_rule_id ON public.follow_up_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_log_status ON public.follow_up_log(status);

ALTER TABLE public.follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage follow-up rules for own chatbots"
  ON public.follow_up_rules
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()))
  WITH CHECK (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));

CREATE POLICY "Users can view follow-up logs for own chatbots"
  ON public.follow_up_log
  FOR SELECT
  TO authenticated
  USING (rule_id IN (SELECT id FROM public.follow_up_rules WHERE chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())));

CREATE POLICY "Service role can insert follow-up logs"
  ON public.follow_up_log
  FOR INSERT
  TO authenticated
  WITH CHECK (rule_id IN (SELECT id FROM public.follow_up_rules WHERE chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())));
