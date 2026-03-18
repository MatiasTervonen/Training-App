-- Helper function to check if two users share a conversation.
-- SECURITY DEFINER bypasses RLS on chat_participants, avoiding infinite recursion
-- when called from storage policies.
DROP FUNCTION IF EXISTS is_chat_partner(uuid);
CREATE FUNCTION is_chat_partner(p_other_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid()
      AND cp2.user_id = p_other_user_id
  );
$$;

-- Replace the read policy to use the helper function
DROP POLICY IF EXISTS "Users can read chat media from conversation partners" ON storage.objects;
CREATE POLICY "Users can read chat media from conversation partners"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR is_chat_partner((storage.foldername(name))[1]::uuid)
    )
  );
