-- Add link_preview JSONB column to chat_messages
ALTER TABLE chat_messages ADD COLUMN link_preview JSONB;

-- Drop and recreate get_messages to include link_preview
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
  link_preview jsonb
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
    cm.link_preview
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;
