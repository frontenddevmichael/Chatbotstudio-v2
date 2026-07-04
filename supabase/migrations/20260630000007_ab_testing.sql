CREATE TABLE IF NOT EXISTS public.chatbot_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name text NOT NULL,
  tone text,
  welcome_message text,
  ai_model text,
  system_prompt_override text,
  traffic_percentage integer DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES public.chatbot_variants(id) ON DELETE CASCADE,
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  total_conversations integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  avg_satisfaction float,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chatbot_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chatbot variants"
  ON public.chatbot_variants
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()))
  WITH CHECK (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));

CREATE POLICY "Public can read active variants"
  ON public.chatbot_variants
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Users can manage own ab test results"
  ON public.ab_test_results
  FOR ALL
  TO authenticated
  USING (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()))
  WITH CHECK (chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid()));

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.chatbot_variants(id);

CREATE INDEX IF NOT EXISTS idx_chatbot_variants_chatbot_id ON public.chatbot_variants(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant_id ON public.ab_test_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_chatbot_id ON public.ab_test_results(chatbot_id);
