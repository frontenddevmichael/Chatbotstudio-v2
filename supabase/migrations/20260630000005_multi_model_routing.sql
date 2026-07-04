-- Multi-model routing for chatbots
ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS ai_model text DEFAULT 'google/gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS fallback_model text,
  ADD COLUMN IF NOT EXISTS routing_strategy text DEFAULT 'single',
  ADD CONSTRAINT chatbots_routing_strategy_check CHECK (routing_strategy IN ('single', 'fallback', 'complexity'));

CREATE TABLE IF NOT EXISTS public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  provider text NOT NULL,
  supports_vision boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.ai_models (name, display_name, provider, supports_vision) VALUES
  ('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google', true),
  ('openai/gpt-4o', 'GPT-4o', 'OpenAI', true),
  ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', true),
  ('mistral/mistral-large', 'Mistral Large', 'Mistral', false),
  ('cohere/command-r-plus', 'Command R+', 'Cohere', false),
  ('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google', true),
  ('openai/gpt-4o-mini', 'GPT-4o Mini', 'OpenAI', true),
  ('meta-llama/llama-3.3-70b', 'Llama 3.3 70B', 'Meta', false)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read ai_models"
  ON public.ai_models
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert ai_models"
  ON public.ai_models
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update ai_models"
  ON public.ai_models
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete ai_models"
  ON public.ai_models
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
