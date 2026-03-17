# Chat Feature (v1)

## Overview

1-on-1 real-time messaging between friends. Database schema is designed to support group chats in the future without migration pain.

---

## Design Decisions

### Existing tables → Drop and replace

The database has 4 empty chat tables (`chat_conversations`, `chat_conversation_participants`, `chat_messages`, `chat_message_status`). They lack RLS, proper defaults, indexes, and the `read_by uuid` column on messages doesn't scale. We drop all 4 and create new ones.

### Conversation model

Each 1-on-1 DM is a `chat_conversations` row with `is_group = false`. Participants are tracked in `chat_participants` (not embedded in the conversation row) so the schema works for both 1-on-1 and future group chats.

**Finding an existing DM:** Before creating a new conversation, check if a 1-on-1 conversation already exists between the two users. This prevents duplicate conversations.

### Real-time via Supabase Realtime

- Subscribe to `chat_messages` INSERT events filtered by `conversation_id`
- Subscribe to `chat_participants` for unread count changes
- No polling — messages appear instantly

### Read tracking

Each participant row has `last_read_at TIMESTAMPTZ`. When a user opens a conversation, update their `last_read_at` to `now()`. Unread count = messages in that conversation with `created_at > last_read_at`. This is simpler and more performant than a per-message read status table.

### Security: SECURITY DEFINER RPCs

RLS has **no INSERT policies** on `chat_conversations` or `chat_participants` — users cannot create conversations or add participants directly via the Supabase client. Only `SECURITY DEFINER` RPCs (`get_or_create_dm`, `send_message`) can write to these tables. These RPCs verify friendship / participation internally before doing anything.

This prevents users from creating conversations with non-friends or adding random people as participants.

### Participant activation: `is_active` flag

`chat_participants.is_active` controls whether a user can send messages. `send_message` checks `is_active = true` — it doesn't check friendship directly. This keeps the messaging logic decoupled from the friendship logic.

**Triggers on `friends` table** handle activation automatically:
- **Unfriend** → trigger sets `is_active = false` on both participants in their 1-on-1 conversation
- **Re-friend** → trigger sets `is_active = true`, restoring the conversation with full history

This is future-proof for group chats: `is_active = false` can mean "left group" or "kicked" — same check in `send_message`, no friendship query needed.

### What's in v1 vs future

| Feature | v1 | Future |
|---------|:--:|:------:|
| 1-on-1 text messages | ✅ | |
| Real-time delivery | ✅ | |
| Unread count badges | ✅ | |
| Conversation list | ✅ | |
| Message timestamps | ✅ | |
| Online/typing indicators | | ✅ |
| Image/media messages | | ✅ |
| Group chats | | ✅ |
| Message reactions | | ✅ |
| Push notifications | | ✅ |
| Message search | | ✅ |
| Message deletion/editing | | ✅ |

---

## Database Schema

### Migration: `supabase/migrations/20260317170000_chat.sql`

### 1. Drop old empty tables

```sql
DROP TABLE IF EXISTS chat_message_status CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversation_participants CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
```

### 2. Create tables (all tables first, then RLS policies)

```sql
-- === TABLES ===

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN NOT NULL DEFAULT false,
  name TEXT,                    -- NULL for 1-on-1, used for future group chats
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
  is_active BOOLEAN NOT NULL DEFAULT true,  -- false = blocked from sending (unfriended, left group, kicked)
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_conversation ON chat_participants(conversation_id);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  attachment_url TEXT,           -- Future: media messages
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
```

### 3. Enable RLS & create policies (after all tables exist)

```sql
-- === RLS ===

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

-- No INSERT policy on chat_conversations — only SECURITY DEFINER RPCs can create
-- No INSERT policy on chat_participants — only SECURITY DEFINER RPCs can add participants

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

CREATE POLICY "Users can send messages to own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE conversation_id = chat_messages.conversation_id
        AND user_id = auth.uid()
    )
  );
```

### 5. Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
```

### 6. Triggers: auto-deactivate/reactivate on unfriend/re-friend

```sql
-- When a friendship is deleted, deactivate both participants in their 1-on-1 conversation
CREATE OR REPLACE FUNCTION handle_friend_removed()
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

-- When a friendship is created, reactivate both participants if a conversation already exists
CREATE OR REPLACE FUNCTION handle_friend_added()
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
```

### 7. RPC: `get_or_create_dm`

Finds an existing 1-on-1 conversation with a friend, or creates one. Returns the conversation ID.

```sql
DROP FUNCTION IF EXISTS get_or_create_dm(uuid);
CREATE FUNCTION get_or_create_dm(p_friend_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to create conversation + participants (friendship verified inside)
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Verify friendship exists
  IF NOT EXISTS (
    SELECT 1 FROM friends
    WHERE (user1_id = auth.uid() AND user2_id = p_friend_id)
       OR (user1_id = p_friend_id AND user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not friends with this user';
  END IF;

  -- Find existing 1-on-1 conversation
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

  -- Create new conversation
  INSERT INTO chat_conversations (is_group)
  VALUES (false)
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO chat_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_friend_id);

  RETURN v_conversation_id;
END;
$$;
```

### 7. RPC: `get_conversations`

Returns all conversations with last message preview and unread count.

```sql
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
  other_user_profile_picture text
)
LANGUAGE plpgsql
SECURITY INVOKER
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
    -- For 1-on-1: the other participant's info
    cp_other.user_id AS other_user_id,
    u.display_name AS other_user_display_name,
    u.profile_picture AS other_user_profile_picture
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
  ORDER BY COALESCE(lm.created_at, cc.created_at) DESC;
END;
$$;
```

### 8. RPC: `get_messages`

Paginated messages for a conversation.

```sql
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
SECURITY INVOKER
AS $$
BEGIN
  -- Verify user is a participant
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
```

### 9. RPC: `send_message`

Sends a message and updates conversation's `updated_at`.

```sql
DROP FUNCTION IF EXISTS send_message(uuid, text);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to insert message + update conversation/participant (participation verified inside)
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

  -- Validate content
  IF char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;

  -- Insert message
  INSERT INTO chat_messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, auth.uid(), p_content)
  RETURNING id INTO v_message_id;

  -- Update conversation timestamp
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  -- Update sender's last_read_at (you've read your own message)
  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  RETURN v_message_id;
END;
$$;
```

### 10. RPC: `mark_conversation_read`

Updates `last_read_at` when user opens/views a conversation.

```sql
DROP FUNCTION IF EXISTS mark_conversation_read(uuid);
CREATE FUNCTION mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;
```

### 11. RPC: `get_total_unread_count`

For the badge on the chat tab/button.

```sql
DROP FUNCTION IF EXISTS get_total_unread_count();
CREATE FUNCTION get_total_unread_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
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
```

---

## Mobile Implementation

### File Structure

```
mobile/
  database/
    chat/
      get-or-create-dm.ts
      get-conversations.ts
      get-messages.ts
      send-message.ts
      mark-conversation-read.ts
      get-total-unread-count.ts
  features/
    chat/
      hooks/
        useConversations.ts         -- Query: conversation list
        useMessages.ts              -- Infinite query: paginated messages
        useSendMessage.ts           -- Mutation: send message + optimistic update
        useMarkRead.ts              -- Mutation: mark conversation as read
        useTotalUnreadCount.ts      -- Query: total unread badge count
        useChatRealtime.ts          -- Supabase realtime subscription
      components/
        ConversationList.tsx         -- FlatList of conversations
        ConversationItem.tsx         -- Single conversation row (avatar, name, preview, unread badge)
        ChatMessageList.tsx          -- Inverted FlatList of messages
        ChatBubble.tsx               -- Single message bubble (own vs other)
        ChatInput.tsx                -- Text input + send button
        ChatHeader.tsx               -- Friend name + avatar in header
        NewChatButton.tsx            -- FAB or header button to start new chat
        FriendPickerSheet.tsx        -- Bottom sheet to pick a friend to DM
  app/
    chat/
      index.tsx                      -- Conversation list screen
      [conversationId].tsx           -- Individual chat screen
  types/
    chat.ts
  locales/
    en/
      chat.json
    fi/
      chat.json
```

### Types

```ts
// types/chat.ts

type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string | null;
  updated_at: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_profile_picture: string | null;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_display_name: string;
  sender_profile_picture: string | null;
};
```

### Database Functions

#### `get-or-create-dm.ts`
```ts
export async function getOrCreateDm(friendId: string) {
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    p_friend_id: friendId,
  });
  if (error) throw error;
  return data as string; // conversation_id
}
```

#### `send-message.ts`
```ts
export async function sendMessage(conversationId: string, content: string) {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content,
  });
  if (error) throw error;
  return data as string; // message_id
}
```

### Hooks

#### `useConversations.ts`
```ts
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}
```

#### `useMessages.ts`
Infinite query loading older messages when scrolling up. Uses cursor-based pagination (`p_before` = oldest message's `created_at`).

```ts
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId, PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].created_at; // oldest message timestamp
    },
    initialPageParam: undefined as string | undefined,
  });
}
```

#### `useSendMessage.ts`
Optimistic update: immediately append the message to the chat with a temp ID, then sync on success.

```ts
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      // Optimistically add message to the list
      // Also update conversation list preview
    },
    onError: (_err, _vars, context) => {
      // Rollback
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
```

#### `useChatRealtime.ts`
Subscribe to new messages in a conversation. On INSERT event, append to the query cache and mark as read.

```ts
export function useChatRealtime(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Append new message to cache (if not from self — avoid duplicating optimistic)
          // Invalidate conversations list for updated preview
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
```

#### `useTotalUnreadCount.ts`
For the badge. Polled on app focus + invalidated when realtime events arrive.

```ts
export function useTotalUnreadCount() {
  return useQuery({
    queryKey: ["total-unread-count"],
    queryFn: getTotalUnreadCount,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Fallback poll every 60s
  });
}
```

### Screens

#### `app/chat/index.tsx` — Conversation List

```
+------------------------------------------+
|  Messages                    [New Chat]   |
|------------------------------------------|
|  [avatar] FriendName            12:34    |
|  Last message preview...     (2) unread  |
|------------------------------------------|
|  [avatar] AnotherFriend        Yesterday |
|  Hey, nice workout!                      |
|------------------------------------------|
|                                          |
|  No messages yet?                        |
|  Start a chat with a friend!             |
+------------------------------------------+
```

- `FlatList` of conversations sorted by last message time
- Each row shows: avatar, friend name, last message preview (truncated), timestamp, unread badge
- Tap row → navigate to `chat/[conversationId]`
- New Chat button → opens `FriendPickerSheet` to select a friend → calls `get_or_create_dm` → navigates to chat

#### `app/chat/[conversationId].tsx` — Chat Screen

```
+------------------------------------------+
|  < FriendName                            |
|------------------------------------------|
|                                          |
|         Hey, great workout today!        |
|                              12:30  [me] |
|                                          |
|  [them] Thanks! Legs were brutal         |
|  12:32                                   |
|                                          |
|         Haha yeah, same here             |
|                              12:33  [me] |
|                                          |
|------------------------------------------|
|  [Type a message...]           [Send]    |
+------------------------------------------+
```

- Inverted `FlatList` — newest messages at bottom
- Load older messages on scroll up (`fetchNextPage`)
- Own messages right-aligned, friend's left-aligned
- Different bubble colors for own vs other
- Auto-scroll to bottom on new message
- Mark conversation as read on mount and when new messages arrive
- Realtime subscription for incoming messages
- Text input with send button (disabled when empty)
- Keyboard-aware: input stays above keyboard

### Navigation

Access chat from:
1. **Social feed header** or **menu** — "Messages" link with unread badge
2. **Friend's profile** — "Send message" button → `get_or_create_dm` → navigate to chat
3. **Deep link from notification** (future)

### Realtime Strategy

**Per-conversation subscription:** When viewing a specific chat, subscribe to `chat_messages` filtered by `conversation_id`. Append incoming messages to the React Query cache.

**Global unread subscription:** On the conversation list and anywhere showing the unread badge, subscribe to `chat_messages` for all conversations the user is in. On any INSERT, invalidate `["total-unread-count"]` and `["conversations"]`.

---

## Translations

### `locales/en/chat.json`
```json
{
  "chat": {
    "title": "Messages",
    "newChat": "New Chat",
    "noConversations": "No messages yet",
    "startChat": "Start a chat with a friend!",
    "typeMessage": "Type a message...",
    "send": "Send",
    "today": "Today",
    "yesterday": "Yesterday",
    "you": "You",
    "selectFriend": "Select a friend",
    "noFriends": "Add friends to start chatting"
  }
}
```

### `locales/fi/chat.json`
```json
{
  "chat": {
    "title": "Viestit",
    "newChat": "Uusi viesti",
    "noConversations": "Ei vielä viestejä",
    "startChat": "Aloita keskustelu kaverin kanssa!",
    "typeMessage": "Kirjoita viesti...",
    "send": "Lähetä",
    "today": "Tänään",
    "yesterday": "Eilen",
    "you": "Sinä",
    "selectFriend": "Valitse kaveri",
    "noFriends": "Lisää kavereita aloittaaksesi keskustelun"
  }
}
```

---

## Implementation Order

### Step 1: Database migration
- Drop old empty chat tables
- Create new tables with RLS
- Create all RPC functions
- Enable Realtime

### Step 2: Types & database functions
- Chat types
- All database fetch/mutation functions

### Step 3: Conversation list screen
- `useConversations` hook
- `ConversationList` and `ConversationItem` components
- `app/chat/index.tsx` page
- New Chat flow: `FriendPickerSheet` → `get_or_create_dm`
- Navigation entry point (menu or tab)

### Step 4: Chat screen
- `useMessages` infinite query hook
- `useSendMessage` mutation with optimistic updates
- `ChatMessageList`, `ChatBubble`, `ChatInput` components
- `app/chat/[conversationId].tsx` page
- Mark as read on mount

### Step 5: Real-time
- `useChatRealtime` hook for per-conversation live messages
- Global realtime for unread count updates
- Invalidate query caches on realtime events

### Step 6: Unread badges
- `useTotalUnreadCount` hook
- Badge on Messages navigation entry
- Per-conversation unread count in list

### Step 7: Polish
- Empty states
- Keyboard handling
- Auto-scroll on new messages
- Message timestamps (group by day)
- Pull-to-refresh conversation list
- Translations

---

## Edge Cases

- **No friends**: Show "Add friends to start chatting" with link to friends page
- **Friend removed**: Trigger sets `is_active = false` on both participants. Conversation stays visible (old messages readable) but input is disabled. If they re-friend, trigger reactivates and full history is preserved.
- **Empty conversation**: Show empty state, don't show in conversation list (handled by `last_message_at IS NULL` sorting)
- **Rapid sending**: Optimistic updates prevent UI lag; mutation queue ensures ordering
- **Offline**: Messages fail gracefully, show retry option
- **Long messages**: Capped at 2000 characters, show character count near limit
- **Same conversation opened on two devices**: Realtime keeps both in sync

---

## Future Enhancements (Group Chat Ready)

The schema already supports groups:
- `chat_conversations.is_group` — flip to `true`
- `chat_conversations.name` — group name
- `chat_participants` — add multiple users
- `get_conversations` RPC already handles `is_group` in its query
- Need: group creation RPC, add/remove participant RPCs, group settings UI
- Need: show sender name in group bubbles (already returned by `get_messages`)

Other future features:
- **Typing indicators**: Supabase Presence on the conversation channel
- **Image messages**: Use `attachment_url` column + Supabase Storage bucket
- **Push notifications**: Edge Function trigger on `chat_messages` INSERT
- **Message search**: Full-text search on `chat_messages.content`
- **Message deletion**: Soft delete with `deleted_at` column
