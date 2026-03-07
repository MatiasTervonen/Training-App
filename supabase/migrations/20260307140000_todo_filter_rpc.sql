DROP FUNCTION IF EXISTS todo_get_filtered(text, int, int);

CREATE FUNCTION todo_get_filtered(
  p_filter text,
  p_limit int,
  p_offset int
) RETURNS SETOF feed_items
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT * FROM feed_items
  WHERE type = 'todo_lists'
    AND user_id = auth.uid()
    AND CASE
      WHEN p_filter = 'active' THEN
        COALESCE((extra_fields->>'completed')::int, 0)
          < COALESCE((extra_fields->>'total')::int, 0)
      WHEN p_filter = 'completed' THEN
        COALESCE((extra_fields->>'total')::int, 0) > 0
        AND COALESCE((extra_fields->>'completed')::int, 0)
          = COALESCE((extra_fields->>'total')::int, 0)
      ELSE true
    END
  ORDER BY activity_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
