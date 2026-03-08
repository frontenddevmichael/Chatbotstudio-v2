
-- 1. Create secure RPC function for widget to fetch chatbot by embed_token
CREATE OR REPLACE FUNCTION public.get_chatbot_by_embed_token(token uuid)
RETURNS TABLE(
  id uuid,
  name text,
  welcome_message text,
  tone text,
  primary_color text,
  avatar_emoji text,
  is_active boolean,
  embed_token uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.welcome_message, c.tone, c.primary_color, c.avatar_emoji, c.is_active, c.embed_token
  FROM public.chatbots c
  WHERE c.embed_token = token AND c.is_active = true
  LIMIT 1;
$$;

-- 2. Drop the overly broad anon SELECT policy on chatbots
DROP POLICY IF EXISTS "Anon can read active chatbots" ON public.chatbots;

-- 3. Fix platform_settings SELECT policy to target authenticated role only
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.platform_settings;
CREATE POLICY "Authenticated can read settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Fix waitlist INSERT policy to target anon role explicitly
DROP POLICY IF EXISTS "Authenticated can insert waitlist" ON public.waitlist;
CREATE POLICY "Anon can insert waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Create is_admin() helper that uses auth.uid() internally
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 6. Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON public.conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_faqs_chatbot_id ON public.faqs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);

-- 7. Create trigger for handle_new_user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
