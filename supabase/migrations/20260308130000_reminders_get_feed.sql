-- RPC to fetch reminder feed items filtered by tab (upcoming/delivered)
CREATE FUNCTION reminders_get_feed(
  p_tab TEXT,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS SETOF feed_items
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF p_tab = 'upcoming' THEN
    RETURN QUERY
      SELECT * FROM feed_items
      WHERE user_id = auth.uid()
        AND hidden_at IS NULL
        AND type IN ('global_reminders', 'local_reminders')
        AND (extra_fields->>'delivered')::boolean IS NOT TRUE
        AND extra_fields->>'seen_at' IS NULL
      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'delivered' THEN
    RETURN QUERY
      SELECT * FROM feed_items
      WHERE user_id = auth.uid()
        AND hidden_at IS NULL
        AND type IN ('global_reminders', 'local_reminders')
        AND (
          (extra_fields->>'delivered')::boolean = true
          OR extra_fields->>'seen_at' IS NOT NULL
        )
      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;
