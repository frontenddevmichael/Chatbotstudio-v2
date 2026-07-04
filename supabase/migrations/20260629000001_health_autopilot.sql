-- FAQ changelog for Health Autopilot: tracks every FAQ change with before/after snapshots
CREATE TABLE IF NOT EXISTS public.faq_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  faq_id uuid REFERENCES public.faqs(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'rollback')),
  field text NOT NULL DEFAULT 'faq',
  old_value text,
  new_value text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'autopilot')),
  metadata jsonb DEFAULT '{}'::jsonb,
  applied_at timestamptz DEFAULT now(),
  rolled_back_at timestamptz
);

ALTER TABLE public.faq_changelog ENABLE ROW LEVEL SECURITY;

-- Users can view changelog for their chatbots
CREATE POLICY "Users can view changelog for own chatbots"
  ON public.faq_changelog
  FOR SELECT
  TO authenticated
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- Service role can insert changelog entries
CREATE POLICY "Service role can manage changelog"
  ON public.faq_changelog
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert manual changelog entries for their own chatbots
CREATE POLICY "Users can insert manual changelog entries"
  ON public.faq_changelog
  FOR INSERT
  TO authenticated
  WITH CHECK (
    source = 'manual'
    AND chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_faq_changelog_chatbot_id ON public.faq_changelog(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_faq_changelog_applied_at ON public.faq_changelog(applied_at DESC);
