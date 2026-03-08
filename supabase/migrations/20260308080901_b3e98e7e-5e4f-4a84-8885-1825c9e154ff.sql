
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  plan text DEFAULT 'free',
  stripe_customer_id text,
  monthly_message_count int DEFAULT 0,
  message_limit int DEFAULT 500,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create chatbots table
CREATE TABLE public.chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  welcome_message text,
  tone text DEFAULT 'friendly',
  primary_color text DEFAULT '#00d4ff',
  avatar_emoji text DEFAULT '🤖',
  is_active boolean DEFAULT true,
  total_conversations int DEFAULT 0,
  embed_token uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chatbots" ON public.chatbots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbots" ON public.chatbots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbots" ON public.chatbots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbots" ON public.chatbots FOR DELETE USING (auth.uid() = user_id);
-- Public read by embed_token for widget
CREATE POLICY "Public can read chatbot by embed_token" ON public.chatbots FOR SELECT USING (true);

-- Create faqs table
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  variations text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chatbot faqs" ON public.faqs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can insert own chatbot faqs" ON public.faqs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can update own chatbot faqs" ON public.faqs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
CREATE POLICY "Users can delete own chatbot faqs" ON public.faqs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = faqs.chatbot_id AND chatbots.user_id = auth.uid()));
-- Public read for widget edge function (service role bypasses RLS anyway)

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  session_id text,
  messages jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chatbot conversations" ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = conversations.chatbot_id AND chatbots.user_id = auth.uid()));

-- Create ads table
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  cta_text text,
  cta_url text,
  image_url text,
  is_active boolean DEFAULT true,
  placement text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ads" ON public.ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage ads" ON public.ads FOR ALL USING (true);

-- Create platform_settings table
CREATE TABLE public.platform_settings (
  id int PRIMARY KEY DEFAULT 1,
  free_message_limit int DEFAULT 500,
  premium_price_monthly numeric DEFAULT 19.99,
  maintenance_mode boolean DEFAULT false,
  announcement_text text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);

-- Insert default settings
INSERT INTO public.platform_settings (id) VALUES (1);

-- Create waitlist table
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (true);

-- Create rate_limits table
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count int DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client access policies - only Edge Functions with service role

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create user_roles table for admin
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
