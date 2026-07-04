-- Add key_hash column to api_keys for secure comparison
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_hash text;

-- Hash any existing keys (migration: copies key value as-is; in production, keys would be re-issued)
UPDATE public.api_keys SET key_hash = encode(sha256(key::bytea), 'hex') WHERE key_hash IS NULL;

-- Make key_hash NOT NULL going forward
ALTER TABLE public.api_keys ALTER COLUMN key_hash SET NOT NULL;

-- Add email_confirmed column to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false;

-- Atomic conversation count increment RPC
CREATE OR REPLACE FUNCTION increment_conversation_count(p_chatbot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chatbots
  SET total_conversations = COALESCE(total_conversations, 0) + 1
  WHERE id = p_chatbot_id;
END;
$$;

-- API key creation RPC: generates a key, stores hash, returns raw key once
CREATE OR REPLACE FUNCTION create_api_key(p_user_id uuid, p_name text, p_scopes text[] DEFAULT '{}')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text;
  v_key_hash text;
BEGIN
  v_key := encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(sha256(v_key::bytea), 'hex');

  INSERT INTO public.api_keys (user_id, name, key, key_hash, scopes)
  VALUES (p_user_id, p_name, v_key, v_key_hash, p_scopes);

  RETURN v_key;
END;
$$;

-- Trigger: auto-hash api_keys.key on insert if key_hash not provided
CREATE OR REPLACE FUNCTION hash_api_key_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.key_hash IS NULL AND NEW.key IS NOT NULL THEN
    NEW.key_hash := encode(sha256(NEW.key::bytea), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_api_key ON public.api_keys;
CREATE TRIGGER trg_hash_api_key
  BEFORE INSERT ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION hash_api_key_on_insert();
