-- Fix comment sorting: use created_at instead of UUID for chronological order
DROP FUNCTION IF EXISTS get_feed_comments(uuid);
CREATE FUNCTION get_feed_comments(p_feed_item_id uuid)
RETURNS TABLE (
  id UUID,
  feed_item_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_display_name TEXT,
  author_profile_picture TEXT,
  reply_to_display_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM feed_items fi
    WHERE fi.id = p_feed_item_id
    AND (
      fi.user_id = auth.uid()
      OR (
        fi.visibility = 'friends'
        AND EXISTS (
          SELECT 1 FROM friends
          WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
             OR (user1_id = fi.user_id AND user2_id = auth.uid())
        )
      )
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    fc.id,
    fc.feed_item_id,
    fc.user_id,
    fc.parent_id,
    fc.content,
    fc.created_at,
    u.display_name AS author_display_name,
    u.profile_picture AS author_profile_picture,
    pu.display_name AS reply_to_display_name
  FROM feed_comments fc
  JOIN users u ON u.id = fc.user_id
  LEFT JOIN feed_comments pc ON pc.id = fc.parent_id
  LEFT JOIN users pu ON pu.id = pc.user_id
  WHERE fc.feed_item_id = p_feed_item_id
  ORDER BY
    COALESCE(pc.created_at, fc.created_at) ASC,  -- group by parent time or own time
    fc.parent_id NULLS FIRST,                     -- parent before its replies
    fc.created_at ASC;                            -- replies in chronological order
END;
$$;
