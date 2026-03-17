-- ============================================================
-- Feed Comments: table, RLS, indexes, RPCs, updated get_friends_feed
-- ============================================================

-- ============================================================
-- 1. Create feed_comments table
-- ============================================================
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_comments_feed_item ON feed_comments(feed_item_id);
CREATE INDEX idx_feed_comments_user ON feed_comments(user_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Friends (and post owner) can read comments on shared feed items
CREATE POLICY "Users can read comments on visible feed items"
  ON feed_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feed_items fi
      WHERE fi.id = feed_item_id
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
    )
  );

CREATE POLICY "Users can insert own comments"
  ON feed_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 2. RPC: get_feed_comments
-- ============================================================
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
  -- Verify caller can see this feed item (own post or friend's shared post)
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
    COALESCE(fc.parent_id, fc.id) ASC,   -- group replies under their parent
    fc.parent_id NULLS FIRST,             -- parent comes before its replies
    fc.created_at ASC;
END;
$$;

-- ============================================================
-- 3. RPC: add_feed_comment
-- ============================================================
DROP FUNCTION IF EXISTS add_feed_comment(uuid, text, uuid);
CREATE FUNCTION add_feed_comment(p_feed_item_id uuid, p_content text, p_parent_id uuid DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Verify caller can see this feed item
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

  -- Validate content length
  IF char_length(p_content) < 1 OR char_length(p_content) > 500 THEN
    RAISE EXCEPTION 'Comment must be 1-500 characters';
  END IF;

  -- If replying, verify parent exists, belongs to same feed item, and is top-level
  IF p_parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM feed_comments
      WHERE id = p_parent_id
        AND feed_item_id = p_feed_item_id
        AND parent_id IS NULL              -- must be top-level (single-level replies only)
    ) THEN
      RAISE EXCEPTION 'Invalid parent comment';
    END IF;
  END IF;

  INSERT INTO feed_comments (feed_item_id, user_id, content, parent_id)
  VALUES (p_feed_item_id, auth.uid(), p_content, p_parent_id)
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$;

-- ============================================================
-- 4. RPC: delete_feed_comment
-- ============================================================
DROP FUNCTION IF EXISTS delete_feed_comment(uuid);
CREATE FUNCTION delete_feed_comment(p_comment_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM feed_comments
  WHERE id = p_comment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or not authorized';
  END IF;
END;
$$;

-- ============================================================
-- 5. Update get_friends_feed to include comment_count
-- ============================================================
DROP FUNCTION IF EXISTS get_friends_feed(integer, integer);
CREATE FUNCTION get_friends_feed(p_limit integer, p_offset integer)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  type TEXT,
  extra_fields JSONB,
  source_id UUID,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  activity_at TIMESTAMPTZ,
  visibility TEXT,
  author_display_name TEXT,
  author_profile_picture TEXT,
  like_count BIGINT,
  user_has_liked BOOLEAN,
  comment_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fi.id,
    fi.user_id,
    fi.title,
    fi.type,
    fi.extra_fields,
    fi.source_id,
    fi.occurred_at,
    fi.created_at,
    fi.updated_at,
    fi.activity_at,
    fi.visibility,
    u.display_name AS author_display_name,
    u.profile_picture AS author_profile_picture,
    COALESCE(lk.cnt, 0) AS like_count,
    EXISTS (
      SELECT 1 FROM feed_likes fl
      WHERE fl.feed_item_id = fi.id AND fl.user_id = auth.uid()
    ) AS user_has_liked,
    COALESCE(cm.cnt, 0) AS comment_count
  FROM feed_items fi
  JOIN users u ON u.id = fi.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM feed_likes WHERE feed_item_id = fi.id
  ) lk ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM feed_comments WHERE feed_item_id = fi.id
  ) cm ON true
  WHERE fi.visibility = 'friends'
    AND fi.user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
         OR (user1_id = fi.user_id AND user2_id = auth.uid())
    )
  ORDER BY fi.activity_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
