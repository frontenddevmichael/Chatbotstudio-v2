
-- Fix: Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- Also create missing trigger and constraints

-- ============ ADS ============
DROP POLICY IF EXISTS "Anyone can read active ads" ON public.ads;
DROP POLICY IF EXISTS "Admin can insert ads" ON public.ads;
DROP POLICY IF EXISTS "Admin can update ads" ON public.ads;
DROP POLICY IF EXISTS "Admin can delete ads" ON public.ads;

CREATE POLICY "Anyone can read active ads" ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can insert ads" ON public.ads FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update ads" ON public.ads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete ads" ON public.ads FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ CHATBOTS ============
DROP POLICY IF EXISTS "Users can read own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can insert own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can update own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Users can delete own chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Anon can read active chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Admin can read all chatbots" ON public.chatbots;
DROP POLICY IF EXISTS "Admin can update all chatbots" ON public.chatbots;

CREATE POLICY "Users can read own chatbots" ON public.chatbots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbots" ON public.chatbots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbots" ON public.chatbots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbots" ON public.chatbots FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon can read active chatbots" ON public.chatbots FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can read all chatbots" ON public.chatbots FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all chatbots" ON public.chatbots FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ CONVERSATIONS ============
DROP POLICY IF EXISTS "Users can read own chatbot conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin can read all conversations" ON public.conversations;

CREATE POLICY "Users can read own chatbot conversations" ON public.conversations FOR SELECT USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = conversations.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Admin can read all conversations" ON public.conversations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update conversations" ON public.conversations FOR UPDATE USING (true);

-- ============ FAQS ============
DROP POLICY IF EXISTS "Users can read own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can insert own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can update own chatbot faqs" ON public.faqs;
DROP POLICY IF EXISTS "Users can delete own chatbot faqs" ON public.faqs;

CREATE POLICY "Users can read own chatbot faqs" ON public.faqs FOR SELECT USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can insert own chatbot faqs" ON public.faqs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can update own chatbot faqs" ON public.faqs FOR UPDATE USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can delete own chatbot faqs" ON public.faqs FOR DELETE USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));

-- ============ PLATFORM SETTINGS ============
DROP POLICY IF EXISTS "Admin can update settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.platform_settings;

CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update settings" ON public.platform_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============ USER ROLES ============
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ============ WAITLIST ============
DROP POLICY IF EXISTS "Authenticated can insert waitlist" ON public.waitlist;

CREATE POLICY "Authenticated can insert waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============ UNIQUE CONSTRAINT on rate_limits ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rate_limits_identifier_endpoint_key') THEN
    ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_identifier_endpoint_key UNIQUE (identifier, endpoint);
  END IF;
END $$;

-- ============ Ensure platform_settings has row ============
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
