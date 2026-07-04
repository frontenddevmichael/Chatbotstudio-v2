CREATE TABLE IF NOT EXISTS public.lighthouse_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  url text NOT NULL,
  performance float,
  accessibility float,
  best_practices float,
  seo float,
  pwa float,
  score_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lighthouse_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lighthouse scores for own chatbots"
  ON public.lighthouse_scores
  FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lighthouse scores for own chatbots"
  ON public.lighthouse_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lighthouse scores for own chatbots"
  ON public.lighthouse_scores
  FOR UPDATE
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lighthouse scores for own chatbots"
  ON public.lighthouse_scores
  FOR DELETE
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_lighthouse_scores_chatbot_id_created_at
  ON public.lighthouse_scores(chatbot_id, created_at DESC);
