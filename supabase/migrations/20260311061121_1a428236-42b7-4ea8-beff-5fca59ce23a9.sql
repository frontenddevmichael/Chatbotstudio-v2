
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  _identifier text,
  _endpoint text,
  _max_requests int DEFAULT 20,
  _window_seconds int DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _window_start timestamptz := now() - (_window_seconds || ' seconds')::interval;
  _current_count int;
BEGIN
  -- Delete expired entries
  DELETE FROM rate_limits
  WHERE identifier = _identifier
    AND endpoint = _endpoint
    AND window_start < _window_start;

  -- Attempt atomic upsert and increment
  INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (_identifier, _endpoint, 1, now())
  ON CONFLICT (identifier, endpoint)
  DO UPDATE SET
    request_count = CASE
      WHEN rate_limits.window_start < _window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < _window_start THEN now()
      ELSE rate_limits.window_start
    END
  RETURNING request_count INTO _current_count;

  RETURN _current_count <= _max_requests;
END;
$$;
