-- Fix: query source tables for reliable delivered status instead of extra_fields
DROP FUNCTION IF EXISTS reminders_get_feed(TEXT, INT, INT);

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
      -- Global reminders not yet delivered
      SELECT fi.* FROM feed_items fi
      INNER JOIN global_reminders gr ON gr.id = fi.source_id
      WHERE fi.user_id = auth.uid()
        AND fi.hidden_at IS NULL
        AND fi.type = 'global_reminders'
        AND gr.delivered = false

      UNION ALL

      -- One-time local reminders not yet fired
      SELECT fi.* FROM feed_items fi
      INNER JOIN local_reminders lr ON lr.id = fi.source_id
      WHERE fi.user_id = auth.uid()
        AND fi.hidden_at IS NULL
        AND fi.type = 'local_reminders'
        AND lr.type = 'one-time'
        AND lr.notify_date > now()

      UNION ALL

      -- Daily/weekly local reminders (always upcoming since they repeat)
      SELECT fi.* FROM feed_items fi
      INNER JOIN local_reminders lr ON lr.id = fi.source_id
      WHERE fi.user_id = auth.uid()
        AND fi.hidden_at IS NULL
        AND fi.type = 'local_reminders'
        AND lr.type IN ('daily', 'weekly')

      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'delivered' THEN
    RETURN QUERY
      -- Global reminders that have been delivered
      SELECT fi.* FROM feed_items fi
      INNER JOIN global_reminders gr ON gr.id = fi.source_id
      WHERE fi.user_id = auth.uid()
        AND fi.hidden_at IS NULL
        AND fi.type = 'global_reminders'
        AND gr.delivered = true

      UNION ALL

      -- One-time local reminders that have fired
      SELECT fi.* FROM feed_items fi
      INNER JOIN local_reminders lr ON lr.id = fi.source_id
      WHERE fi.user_id = auth.uid()
        AND fi.hidden_at IS NULL
        AND fi.type = 'local_reminders'
        AND lr.type = 'one-time'
        AND lr.notify_date <= now()

      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;
