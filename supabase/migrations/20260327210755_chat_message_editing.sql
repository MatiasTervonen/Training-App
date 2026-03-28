-- ============================================================
-- 1. Add edited_at column to chat_messages
-- ============================================================

ALTER TABLE chat_messages
  ADD COLUMN edited_at TIMESTAMPTZ;

-- ============================================================
-- 2. Create edit_message RPC
-- ============================================================

CREATE FUNCTION edit_message(p_message_id uuid, p_content text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Only text messages owned by the caller can be edited
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE id = p_message_id
      AND sender_id = auth.uid()
      AND deleted_at IS NULL
      AND message_type = 'text'
  ) THEN
    RAISE EXCEPTION 'Message not found or not authorized';
  END IF;

  IF p_content IS NULL OR char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;

  UPDATE chat_messages
  SET content = p_content,
      edited_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid();
END;
$$;

-- ============================================================
-- 3. Update get_messages to return edited_at
-- ============================================================

DROP FUNCTION IF EXISTS get_messages(uuid, integer, timestamptz);
CREATE FUNCTION get_messages(
  p_conversation_id uuid,
  p_limit integer DEFAULT 50,
  p_before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  sender_display_name text,
  sender_profile_picture text,
  message_type text,
  media_storage_path text,
  media_thumbnail_path text,
  media_duration_ms integer,
  link_preview jsonb,
  deleted_at timestamptz,
  edited_at timestamptz,
  reply_to_message_id uuid,
  reply_to_content text,
  reply_to_sender_name text,
  reply_to_message_type text,
  reply_to_deleted_at timestamptz,
  reactions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  RETURN QUERY
  SELECT
    cm.id,
    cm.conversation_id,
    cm.sender_id,
    cm.content,
    cm.created_at,
    u.display_name AS sender_display_name,
    u.profile_picture AS sender_profile_picture,
    cm.message_type,
    cm.media_storage_path,
    cm.media_thumbnail_path,
    cm.media_duration_ms,
    cm.link_preview,
    cm.deleted_at,
    cm.edited_at,
    cm.reply_to_message_id,
    reply_msg.content AS reply_to_content,
    reply_user.display_name AS reply_to_sender_name,
    reply_msg.message_type AS reply_to_message_type,
    reply_msg.deleted_at AS reply_to_deleted_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'emoji', r.emoji,
        'count', r.cnt,
        'user_reacted', r.user_reacted
      ))
      FROM (
        SELECT
          cr.emoji,
          COUNT(*) AS cnt,
          bool_or(cr.user_id = auth.uid()) AS user_reacted
        FROM chat_reactions cr
        WHERE cr.message_id = cm.id
        GROUP BY cr.emoji
        ORDER BY MIN(cr.created_at)
      ) r),
      '[]'::jsonb
    ) AS reactions
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  LEFT JOIN chat_messages reply_msg ON reply_msg.id = cm.reply_to_message_id
  LEFT JOIN users reply_user ON reply_user.id = reply_msg.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;
