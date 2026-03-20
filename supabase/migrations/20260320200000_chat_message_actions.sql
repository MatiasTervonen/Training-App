-- ============================================================
-- 1. Add columns to chat_messages (reply support + soft delete)
-- ============================================================

ALTER TABLE chat_messages
  ADD COLUMN reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

ALTER TABLE chat_messages
  ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;

-- ============================================================
-- 2. Create chat_reactions table with RLS policies
-- ============================================================

CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_chat_reactions_message ON chat_reactions(message_id);

ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions in their conversations"
  ON chat_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cp.conversation_id = cm.conversation_id
      WHERE cm.id = chat_reactions.message_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add own reactions"
  ON chat_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cp.conversation_id = cm.conversation_id
      WHERE cm.id = chat_reactions.message_id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = chat_reactions.message_id
        AND cm.deleted_at IS NOT NULL
    )
  );

CREATE POLICY "Users can remove own reactions"
  ON chat_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 3. Drop and recreate send_message with reply support
-- ============================================================

DROP FUNCTION IF EXISTS send_message(uuid, text, text, text, text, integer);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_media_storage_path text DEFAULT NULL,
  p_media_thumbnail_path text DEFAULT NULL,
  p_media_duration_ms integer DEFAULT NULL,
  p_reply_to_message_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot send messages in this conversation';
  END IF;

  IF p_message_type NOT IN ('text', 'image', 'video', 'voice') THEN
    RAISE EXCEPTION 'Invalid message type';
  END IF;

  IF p_message_type = 'text' THEN
    IF p_content IS NULL OR char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
      RAISE EXCEPTION 'Text message must be between 1 and 2000 characters';
    END IF;
  END IF;

  IF p_message_type IN ('image', 'video', 'voice') THEN
    IF p_media_storage_path IS NULL THEN
      RAISE EXCEPTION 'Media messages must include a storage path';
    END IF;
  END IF;

  IF p_reply_to_message_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM chat_messages
      WHERE id = p_reply_to_message_id
        AND conversation_id = p_conversation_id
    ) THEN
      RAISE EXCEPTION 'Reply target not found in this conversation';
    END IF;
  END IF;

  INSERT INTO chat_messages (
    conversation_id, sender_id, content,
    message_type, media_storage_path, media_thumbnail_path, media_duration_ms,
    reply_to_message_id
  )
  VALUES (
    p_conversation_id, auth.uid(), p_content,
    p_message_type, p_media_storage_path, p_media_thumbnail_path, p_media_duration_ms,
    p_reply_to_message_id
  )
  RETURNING id INTO v_message_id;

  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  RETURN v_message_id;
END;
$$;

-- ============================================================
-- 4. Create delete_message RPC
-- ============================================================

CREATE FUNCTION delete_message(p_message_id uuid)
RETURNS TABLE (media_path text, thumbnail_path text)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE id = p_message_id
      AND sender_id = auth.uid()
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Message not found or not authorized';
  END IF;

  RETURN QUERY
  SELECT cm.media_storage_path AS media_path, cm.media_thumbnail_path AS thumbnail_path
  FROM chat_messages cm
  WHERE cm.id = p_message_id;

  UPDATE chat_messages
  SET
    content = NULL,
    media_storage_path = NULL,
    media_thumbnail_path = NULL,
    media_duration_ms = NULL,
    link_preview = NULL,
    deleted_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid();
END;
$$;

-- ============================================================
-- 5. Create toggle_reaction RPC
-- ============================================================

CREATE FUNCTION toggle_reaction(p_message_id uuid, p_emoji text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_existing_id uuid;
  v_conversation_id uuid;
BEGIN
  SELECT cm.conversation_id INTO v_conversation_id
  FROM chat_messages cm
  WHERE cm.id = p_message_id
    AND cm.deleted_at IS NULL;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or deleted';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  SELECT id INTO v_existing_id
  FROM chat_reactions
  WHERE message_id = p_message_id
    AND user_id = auth.uid()
    AND emoji = p_emoji;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM chat_reactions WHERE id = v_existing_id;
    RETURN false;
  ELSE
    INSERT INTO chat_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, auth.uid(), p_emoji);
    RETURN true;
  END IF;
END;
$$;

-- ============================================================
-- 6. Drop and recreate get_messages with reply data and reactions
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
