-- Chat Location Sharing: add location message type

-- ============================================================
-- 1. Update CHECK constraint to allow location messages
-- ============================================================

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_check
  CHECK (
    deleted_at IS NOT NULL  -- soft-deleted messages bypass validation
    OR (message_type = 'text' AND content IS NOT NULL AND char_length(content) BETWEEN 1 AND 2000)
    OR (message_type IN ('image', 'video', 'voice') AND media_storage_path IS NOT NULL)
    OR (message_type = 'session_share' AND content IS NOT NULL)
    OR (message_type = 'location' AND content IS NOT NULL)
  );

-- ============================================================
-- 2. Update send_message to support location type
-- ============================================================

DROP FUNCTION IF EXISTS send_message(uuid, text, text, text, text, integer, uuid);
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
  v_content_json jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot send messages in this conversation';
  END IF;

  IF p_message_type NOT IN ('text', 'image', 'video', 'voice', 'session_share', 'location') THEN
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

  IF p_message_type = 'session_share' THEN
    IF p_content IS NULL THEN
      RAISE EXCEPTION 'Session share must include content';
    END IF;
    IF p_media_storage_path IS NOT NULL THEN
      RAISE EXCEPTION 'Session share must not include media';
    END IF;
    BEGIN
      v_content_json := p_content::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Session share content must be valid JSON';
    END;
    IF v_content_json->>'session_type' IS NULL
       OR v_content_json->>'source_id' IS NULL
       OR v_content_json->>'title' IS NULL THEN
      RAISE EXCEPTION 'Session share must include session_type, source_id, and title';
    END IF;
  END IF;

  IF p_message_type = 'location' THEN
    IF p_content IS NULL THEN
      RAISE EXCEPTION 'Location message must include content';
    END IF;
    IF p_media_storage_path IS NOT NULL THEN
      RAISE EXCEPTION 'Location message must not include media';
    END IF;
    BEGIN
      v_content_json := p_content::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Location content must be valid JSON';
    END;
    IF v_content_json->>'lat' IS NULL
       OR v_content_json->>'lng' IS NULL THEN
      RAISE EXCEPTION 'Location must include lat and lng';
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
