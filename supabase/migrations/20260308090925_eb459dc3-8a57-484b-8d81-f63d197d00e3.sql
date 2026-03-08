
-- Fix rate_limits: add RLS policy for service role operations
-- rate_limits is managed by edge functions using service_role key, 
-- so we allow all for authenticated service operations
CREATE POLICY "Allow all for rate_limits" ON public.rate_limits FOR ALL USING (true) WITH CHECK (true);
