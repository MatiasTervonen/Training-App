-- Admin RPC to fetch all feedback with user info, paginated
CREATE OR REPLACE FUNCTION get_all_feedback(
  p_limit  INT DEFAULT 15,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id           UUID,
  user_id      UUID,
  category     TEXT,
  title        TEXT,
  message      TEXT,
  image_paths  TEXT[],
  created_at   TIMESTAMPTZ,
  user_email   TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT (auth.jwt()->'app_metadata'->>'role') INTO v_role;
  IF v_role IS NULL OR v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.user_id,
    f.category,
    f.title,
    f.message,
    f.image_paths,
    f.created_at,
    u.email,
    u.display_name
  FROM feedback f
  JOIN users u ON u.id = f.user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
