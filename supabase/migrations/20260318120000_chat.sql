-- ============================================================
-- Chat feature: 1-on-1 messaging between friends
-- Future-proof for group chats
-- ============================================================

-- 1. Drop old empty chat tables
DROP TABLE IF EXISTS chat_message_status CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversation_participants CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;

-- 2. Create tables

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_conversation ON chat_participants(conversation_id);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);

-- 3. RLS

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_conversations policies
CREATE POLICY "Users can read own conversations"
  ON chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update conversations"
  ON chat_conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_conversations.id
        AND user_id = auth.uid()
    )
  );

-- chat_participants policies
CREATE POLICY "Users can read participants of own conversations"
  ON chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.conversation_id = chat_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own participant row"
  ON chat_participants FOR UPDATE
  USING (user_id = auth.uid());

-- chat_messages policies
CREATE POLICY "Users can read messages in own conversations"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- 4. Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;

-- 5. Triggers: auto-deactivate/reactivate on unfriend/re-friend

DROP FUNCTION IF EXISTS handle_friend_removed() CASCADE;
CREATE FUNCTION handle_friend_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE chat_participants
  SET is_active = false
  WHERE conversation_id IN (
    SELECT cc.id
    FROM chat_conversations cc
    JOIN chat_participants cp1 ON cp1.conversation_id = cc.id AND cp1.user_id = OLD.user1_id
    JOIN chat_participants cp2 ON cp2.conversation_id = cc.id AND cp2.user_id = OLD.user2_id
    WHERE cc.is_group = false
  )
  AND user_id IN (OLD.user1_id, OLD.user2_id);

  RETURN OLD;
END;
$$;

CREATE TRIGGER on_friend_removed
  AFTER DELETE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_removed();

DROP FUNCTION IF EXISTS handle_friend_added() CASCADE;
CREATE FUNCTION handle_friend_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE chat_participants
  SET is_active = true
  WHERE conversation_id IN (
    SELECT cc.id
    FROM chat_conversations cc
    JOIN chat_participants cp1 ON cp1.conversation_id = cc.id AND cp1.user_id = NEW.user1_id
    JOIN chat_participants cp2 ON cp2.conversation_id = cc.id AND cp2.user_id = NEW.user2_id
    WHERE cc.is_group = false
  )
  AND user_id IN (NEW.user1_id, NEW.user2_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_added
  AFTER INSERT ON friends
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_added();

-- 6. RPCs

-- get_or_create_dm: Find existing 1-on-1 conversation or create one
DROP FUNCTION IF EXISTS get_or_create_dm(uuid);
CREATE FUNCTION get_or_create_dm(p_friend_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM friends
    WHERE (user1_id = auth.uid() AND user2_id = p_friend_id)
       OR (user1_id = p_friend_id AND user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not friends with this user';
  END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN chat_conversations cc ON cc.id = cp1.conversation_id
  WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = p_friend_id
    AND cc.is_group = false;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO chat_conversations (is_group)
  VALUES (false)
  RETURNING id INTO v_conversation_id;

  INSERT INTO chat_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_friend_id);

  RETURN v_conversation_id;
END;
$$;

-- get_conversations: All conversations with last message and unread count
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
SECURITY DEFINER  -- Bypasses RLS for internal joins (participation verified by JOIN on auth.uid())
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

-- get_messages: Paginated messages for a conversation
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
SECURITY DEFINER  -- Bypasses RLS for internal joins (participation verified inside)
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

-- send_message: Send a message (SECURITY DEFINER to bypass RLS for inserts)
DROP FUNCTION IF EXISTS send_message(uuid, text);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text
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

  IF char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;

  INSERT INTO chat_messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, auth.uid(), p_content)
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

-- mark_conversation_read: Update last_read_at
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

-- get_total_unread_count: For badge
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
