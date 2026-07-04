-- Restore profiles for orphaned auth users (users in auth.users without a profiles row)

-- RPC called from client to create a missing profile
CREATE OR REPLACE FUNCTION public.restore_user_profile(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, message_limit)
  VALUES (p_user_id, '', 'free', 500)
  ON CONFLICT (id) DO NOTHING;
  RETURN FOUND;
END;
$$;

-- One-time backfill: create profiles for all auth users who lack them
INSERT INTO public.profiles (id, full_name, plan, message_limit)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', ''), 'free', 500
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
