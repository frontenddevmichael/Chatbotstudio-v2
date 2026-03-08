
-- 1. Create auth trigger for auto-creating profiles on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add admin SELECT on waitlist
CREATE POLICY "Admin can read waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Remove overly permissive rate_limits policy, replace with deny-all (service role bypasses RLS)
DROP POLICY IF EXISTS "Allow all for rate_limits" ON public.rate_limits;

-- 4. Tighten conversations INSERT/UPDATE to anon+authenticated (service role bypasses anyway)
DROP POLICY IF EXISTS "Service can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Service can update conversations" ON public.conversations;
