-- Fix infinite recursion: toggle_reaction and delete_message use SECURITY INVOKER
-- which triggers RLS on chat_participants, causing circular policy evaluation.
-- Change to SECURITY DEFINER (same as send_message) to bypass RLS within the function.

DROP FUNCTION IF EXISTS toggle_reaction(uuid, text);
CREATE FUNCTION toggle_reaction(p_message_id uuid, p_emoji text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP FUNCTION IF EXISTS delete_message(uuid);
CREATE FUNCTION delete_message(p_message_id uuid)
RETURNS TABLE (media_path text, thumbnail_path text)
LANGUAGE plpgsql
SECURITY DEFINER
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
