-- edit_message needs SECURITY DEFINER (same as delete_message)
-- because there are no UPDATE RLS policies on chat_messages.
-- The function already verifies sender_id = auth.uid() internally.

DROP FUNCTION IF EXISTS edit_message(uuid, text);
CREATE FUNCTION edit_message(p_message_id uuid, p_content text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
