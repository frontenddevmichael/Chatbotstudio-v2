CREATE TABLE IF NOT EXISTS public.conversation_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  annotation text NOT NULL,
  message_index integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_annotations_conversation_id ON public.conversation_annotations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_annotations_user_id ON public.conversation_annotations(user_id);

CREATE TABLE IF NOT EXISTS public.conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation_id ON public.conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag ON public.conversation_tags(tag);

ALTER TABLE public.conversation_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage annotations for own chatbot conversations"
  ON public.conversation_annotations
  FOR ALL
  TO authenticated
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage tags for own chatbot conversations"
  ON public.conversation_tags
  FOR ALL
  TO authenticated
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())))
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE chatbot_id IN (SELECT id FROM public.chatbots WHERE user_id = auth.uid())));
