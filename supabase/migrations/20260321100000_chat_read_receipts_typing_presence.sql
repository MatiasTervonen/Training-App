-- ============================================================
-- RPC: get other participant's last_read_at for read receipts
-- ============================================================

DROP FUNCTION IF EXISTS get_other_participant_last_read(uuid);
CREATE FUNCTION get_other_participant_last_read(p_conversation_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_read timestamptz;
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  SELECT cp.last_read_at INTO v_last_read
  FROM chat_participants cp
  WHERE cp.conversation_id = p_conversation_id
    AND cp.user_id != auth.uid()
  LIMIT 1;

  RETURN v_last_read;
END;
$$;
