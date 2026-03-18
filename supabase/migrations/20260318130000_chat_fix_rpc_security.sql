-- Fix: RLS on chat tables blocks internal joins in SECURITY INVOKER RPCs.
-- Switch read RPCs to SECURITY DEFINER (participation is verified inside each function).

-- get_conversations
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
    SELECT cm.content, cm.created_at, cm.sender_id
    FROM chat_messages cm
    WHERE cm.conversation_id = cc.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE lm.created_at IS NOT NULL
  ORDER BY COALESCE(lm.created_at, cc.created_at) DESC;
END;
$$;

-- get_messages
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
  sender_profile_picture text
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
    u.profile_picture AS sender_profile_picture
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;

-- mark_conversation_read
DROP FUNCTION IF EXISTS mark_conversation_read(uuid);
CREATE FUNCTION mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;

-- get_total_unread_count
DROP FUNCTION IF EXISTS get_total_unread_count();
CREATE FUNCTION get_total_unread_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count bigint;
BEGIN
  SELECT COALESCE(SUM(unread), 0) INTO v_count
  FROM (
    SELECT COUNT(*) AS unread
    FROM chat_participants cp
    JOIN chat_messages cm ON cm.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
      AND cm.created_at > cp.last_read_at
      AND cm.sender_id != auth.uid()
    GROUP BY cp.conversation_id
  ) sub;

  RETURN v_count;
END;
$$;
