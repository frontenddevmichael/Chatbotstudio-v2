-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to faqs table
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_faqs_embedding ON public.faqs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Match FAQs by semantic similarity
CREATE OR REPLACE FUNCTION public.match_faqs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_chatbot_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  chatbot_id uuid,
  question text,
  answer text,
  variations text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faqs.id,
    faqs.chatbot_id,
    faqs.question,
    faqs.answer,
    faqs.variations,
    1 - (faqs.embedding <=> query_embedding) AS similarity
  FROM faqs
  WHERE faqs.embedding IS NOT NULL
    AND (p_chatbot_id IS NULL OR faqs.chatbot_id = p_chatbot_id)
    AND 1 - (faqs.embedding <=> query_embedding) > match_threshold
  ORDER BY faqs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
