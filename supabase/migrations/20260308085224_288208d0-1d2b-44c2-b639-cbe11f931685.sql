
-- Fix ALL RLS policies: drop RESTRICTIVE, recreate as PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- chatbots
DROP POLICY IF EXISTS "Users can read own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can insert own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can update own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can delete own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Anon can read active chatbots" ON public.chatbots;
CREATE POLICY "Users can read own chatbots" ON public.chatbots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbots" ON public.chatbots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbots" ON public.chatbots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbots" ON public.chatbots FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anon can read active chatbots" ON public.chatbots FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Admin can read all chatbots" ON public.chatbots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all chatbots" ON public.chatbots FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- faqs
DROP POLICY IF EXISTS "Users can read own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can insert own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can update own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can delete own chatbot faqs" ON public.faqs;
CREATE POLICY "Users can read own chatbot faqs" ON public.faqs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can insert own chatbot faqs" ON public.faqs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can update own chatbot faqs" ON public.faqs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can delete own chatbot faqs" ON public.faqs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));

-- conversations
DROP POLICY IF EXISTS "Users can read own chatbot conversations" ON public.conversations;
CREATE POLICY "Users can read own chatbot conversations" ON public.conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = conversations.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Admin can read all conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ads
DROP POLICY IF EXISTS "Authenticated users can read ads" ON public.ads;
CREATE POLICY "Anyone can read active ads" ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can insert ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update ads" ON public.ads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete ads" ON public.ads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- platform_settings
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.platform_settings;
CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update settings" ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- waitlist
DROP POLICY IF EXISTS "Authenticated users can insert waitlist" ON public.waitlist;
CREATE POLICY "Authenticated can insert waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (true);

-- user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Seed platform_settings row
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Add unique constraint on rate_limits if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rate_limits_identifier_endpoint_key') THEN
    ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_identifier_endpoint_key UNIQUE (identifier, endpoint);
  END IF;
END $$;
