-- Add visitor_id for cross-session conversation memory
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS visitor_id text;

-- Index for fast visitor lookups
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON public.conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_chatbot ON public.conversations(visitor_id, chatbot_id);
