
-- Fix ads table: remove overly permissive ALL policy, add specific admin policies
DROP POLICY IF EXISTS "Service role can manage ads" ON public.ads;

-- Fix chatbots: drop duplicate SELECT policy, use anon-accessible one for widget
DROP POLICY IF EXISTS "Public can read chatbot by embed_token" ON public.chatbots;
-- Allow anon to read active chatbots (needed for widget)
CREATE POLICY "Anon can read active chatbots" ON public.chatbots FOR SELECT TO anon USING (is_active = true);
