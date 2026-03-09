CREATE OR REPLACE FUNCTION public.increment_message_count(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET monthly_message_count = COALESCE(monthly_message_count, 0) + 1
  WHERE id = _user_id;
$$;