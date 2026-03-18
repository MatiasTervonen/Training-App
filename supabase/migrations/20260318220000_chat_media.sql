-- Add media columns to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN media_storage_path TEXT,
  ADD COLUMN media_thumbnail_path TEXT,
  ADD COLUMN media_duration_ms INTEGER;

-- Drop unused attachment_url column
ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_url;

-- Allow empty content for media messages (media-only, no caption)
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_check;
ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_check
  CHECK (
    (message_type = 'text' AND content IS NOT NULL AND char_length(content) BETWEEN 1 AND 2000)
    OR (message_type IN ('image', 'video', 'voice') AND media_storage_path IS NOT NULL)
  );

-- Index for filtering by type
CREATE INDEX idx_chat_messages_type ON chat_messages(conversation_id, message_type)
  WHERE message_type != 'text';

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  524288000,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/m4a', 'audio/mp4', 'audio/x-m4a'
  ]
);

-- Upload: users can upload to their own folder
CREATE POLICY "Users can upload own chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Read: users can read media from conversations they participate in
CREATE POLICY "Users can read chat media from conversation partners"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      EXISTS (
        SELECT 1 FROM chat_participants cp1
        JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid()
          AND cp2.user_id = (storage.foldername(name))[1]::uuid
      )
    )
  );

-- Delete: users can only delete their own uploads
CREATE POLICY "Users can delete own chat media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Drop old send_message and create new one with media support
DROP FUNCTION IF EXISTS send_message(uuid, text);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_media_storage_path text DEFAULT NULL,
  p_media_thumbnail_path text DEFAULT NULL,
  p_media_duration_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  -- Verify user is an active participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot send messages in this conversation';
  END IF;

  -- Validate message type
  IF p_message_type NOT IN ('text', 'image', 'video', 'voice') THEN
    RAISE EXCEPTION 'Invalid message type';
  END IF;

  -- Validate text messages
  IF p_message_type = 'text' THEN
    IF p_content IS NULL OR char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
      RAISE EXCEPTION 'Text message must be between 1 and 2000 characters';
    END IF;
  END IF;

  -- Validate media messages
  IF p_message_type IN ('image', 'video', 'voice') THEN
    IF p_media_storage_path IS NULL THEN
      RAISE EXCEPTION 'Media messages must include a storage path';
    END IF;
  END IF;

  -- Insert message
  INSERT INTO chat_messages (
    conversation_id, sender_id, content,
    message_type, media_storage_path, media_thumbnail_path, media_duration_ms
  )
  VALUES (
    p_conversation_id, auth.uid(), p_content,
    p_message_type, p_media_storage_path, p_media_thumbnail_path, p_media_duration_ms
  )
  RETURNING id INTO v_message_id;

  -- Update conversation timestamp
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  -- Update sender's last_read_at
  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  RETURN v_message_id;
END;
$$;

-- Drop and recreate get_messages with media columns
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
  media_duration_ms integer
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
    cm.media_duration_ms
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Drop and recreate get_conversations with last_message_type
DROP FUNCTION IF EXISTS get_conversations();
CREATE FUNCTION get_conversations()
RETURNS TABLE (
  conversation_id uuid,
  is_group boolean,
  conversation_name text,
  updated_at timestamptz,
  last_message_content text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  last_message_type text,
  unread_count bigint,
  other_user_id uuid,
  other_user_display_name text,
  other_user_profile_picture text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id AS conversation_id,
    cc.is_group,
    cc.name AS conversation_name,
    cc.updated_at,
    lm.content AS last_message_content,
    lm.created_at AS last_message_at,
    lm.sender_id AS last_message_sender_id,
    lm.message_type AS last_message_type,
    COALESCE(
      (SELECT COUNT(*) FROM chat_messages cm
       WHERE cm.conversation_id = cc.id
         AND cm.created_at > cp_me.last_read_at
         AND cm.sender_id != auth.uid()),
      0
    ) AS unread_count,
    cp_other.user_id AS other_user_id,
    u.display_name AS other_user_display_name,
    u.profile_picture AS other_user_profile_picture,
    cp_me.is_active
  FROM chat_conversations cc
  JOIN chat_participants cp_me ON cp_me.conversation_id = cc.id AND cp_me.user_id = auth.uid()
  LEFT JOIN chat_participants cp_other ON cp_other.conversation_id = cc.id AND cp_other.user_id != auth.uid() AND cc.is_group = false
  LEFT JOIN users u ON u.id = cp_other.user_id
  LEFT JOIN LATERAL (
    SELECT cm.content, cm.created_at, cm.sender_id, cm.message_type
    FROM chat_messages cm
    WHERE cm.conversation_id = cc.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE lm.created_at IS NOT NULL
  ORDER BY COALESCE(lm.created_at, cc.created_at) DESC;
END;
$$;
