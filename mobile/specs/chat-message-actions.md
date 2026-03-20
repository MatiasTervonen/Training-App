# Chat Message Actions

## Overview

Add message interaction capabilities to the chat: long-press a message bubble to reveal a toolbar with actions (delete, copy, forward, reply) and tap to add emoji reactions. This brings the chat up to par with modern messaging apps.

---

## Features

### 1. Long-press toolbar

Long-pressing any message bubble opens a top toolbar with context actions. The selected message gets a subtle highlight and the rest of the chat dims slightly. Tapping outside or pressing back dismisses the toolbar.

```
+------------------------------------------+
| [Reply] [Copy] [Forward] [Delete]        |  ← Toolbar (top of chat area)
|------------------------------------------|
|                                          |
|        Hey, how's it going?       ← dim  |
|                                          |
|        [  Selected message  ]     ← highlight
|                                          |
|        Yeah, good workout today!  ← dim  |
|                                          |
+------------------------------------------+
```

**Actions available:**

| Action  | Own messages | Other's messages |
|---------|-------------|-----------------|
| Reply   | Yes         | Yes             |
| Copy    | Yes (text only) | Yes (text only) |
| Forward | Yes         | Yes             |
| Delete  | Yes         | No              |

- **Copy** only appears for text messages (no point copying an image path)
- **Delete** only appears for your own messages

### 2. Reply to messages

Replying to a message shows a reply preview bar above the chat input. The replied-to message is displayed inline above the reply in the chat.

**Reply preview (above input while composing):**
```
+------------------------------------------+
| [X]  Replying to John                    |
|      "Hey, how's it going?"              |
|------------------------------------------|
| [+]  [Type a message...]         [Send]  |
+------------------------------------------+
```

**Reply displayed in chat:**
```
+----------------------------+
| ┃ John                     |  ← quoted message (compact, gray)
| ┃ Hey, how's it going?     |
|                            |
| Yeah, I'm doing great!     |  ← actual reply
+----------------------------+
```

- Tapping the quoted reply scrolls to and briefly highlights the original message
- Replies to media messages show type label: "Photo", "Video", "Voice message"
- Reply preview is truncated to 2 lines max
- Can reply with text or media

### 3. Forward messages

Forwarding opens the FriendPickerSheet (already exists). Selecting a friend sends the message to that DM conversation.

- Text messages: forwarded as a new text message (no "forwarded" label — keep it simple)
- Media messages: reference the same storage path (no re-upload needed, both users already have read access via conversation membership)
- After forwarding, show a success toast and stay on the current chat

### 4. Delete messages

Delete removes your own message. Two options:
- **Delete for me** — soft-deletes the message (only the sender stops seeing it)
- **Delete for everyone** — hard-deletes the message content, replaces with "This message was deleted" placeholder

For simplicity in v1: **delete for everyone only**. The message row stays but content is cleared and a `deleted_at` timestamp is set. Both users see "This message was deleted" in italic gray text.

- If the deleted message had media, the storage files are also cleaned up
- If someone replied to a deleted message, the quoted preview shows "This message was deleted"
- Deleted messages cannot be reacted to

### 5. Emoji reactions

Tap-and-hold already opens the toolbar. Add a row of quick-reaction emojis below the toolbar:

```
+------------------------------------------+
| [Reply] [Copy] [Forward] [Delete]        |
| [👍] [❤️] [😂] [😮] [😢] [🔥] [+]       |  ← Quick reactions + picker
+------------------------------------------+
```

- 6 quick reactions: 👍 ❤️ 😂 😮 😢 🔥
- [+] opens a small emoji grid with more options (top ~30 emojis, no full keyboard)
- Each user can add one reaction per emoji per message (toggle on/off)
- Multiple different emojis can be on the same message
- Reactions display below the message bubble:

```
+----------------------------+
|  Great workout today!      |
+----------------------------+
  [👍 2] [🔥 1]                ← reaction pills
```

- Tapping a reaction pill toggles your own reaction (add/remove)
- Long-pressing a reaction pill shows who reacted (small tooltip)
- Reaction pills use the bubble alignment (right-aligned for own, left for others)

---

## Design Decisions

### Toolbar vs context menu

**Toolbar at the top** (chosen) vs bottom sheet / floating menu near the bubble.

Top toolbar is cleaner for this app — it avoids overlapping with the keyboard, works consistently regardless of message position, and matches the minimal UI style. The actions are always in the same predictable spot.

### Delete strategy

**Delete for everyone only** (v1). Simpler DB model — just set `deleted_at` on the row and clear content/media. No need for a per-user visibility table. Can add "delete for me" later if needed.

### Reaction storage

**Separate `chat_reactions` table** rather than a JSONB column on `chat_messages`. Reasons:
- Clean RLS: users can only add/remove their own reactions
- Realtime works out of the box (INSERT/DELETE on the reactions table)
- No race conditions from concurrent JSONB updates on the same message row
- Easy to query "who reacted with X"

### Reply storage

**`reply_to_message_id` column on `chat_messages`** — a simple FK back to the same table. The reply preview data (sender name, content snippet) is fetched at query time, not denormalized, so it stays accurate even if the original message is edited or deleted.

### Forward implementation

**Create a new message** in the target conversation rather than a "forwarded_from" reference. This is simpler and means the forwarded message lives independently — deleting the original doesn't affect the forward, and there's no cross-conversation data leak.

---

## Database Schema

### Migration: `supabase/migrations/YYYYMMDDHHMMSS_chat_message_actions.sql`

### 1. Add reply and delete columns to chat_messages

```sql
-- Add reply support
ALTER TABLE chat_messages
  ADD COLUMN reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add soft delete support
ALTER TABLE chat_messages
  ADD COLUMN deleted_at TIMESTAMPTZ;

-- Index for reply lookups
CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;
```

### 2. Create chat_reactions table

```sql
CREATE TABLE chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)  -- one reaction per emoji per user per message
);

-- Index for fetching reactions by message
CREATE INDEX idx_chat_reactions_message ON chat_reactions(message_id);

-- RLS
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

-- Users can read reactions on messages in conversations they participate in
CREATE POLICY "Users can read reactions in their conversations"
  ON chat_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cp.conversation_id = cm.conversation_id
      WHERE cm.id = chat_reactions.message_id
        AND cp.user_id = auth.uid()
    )
  );

-- Users can add their own reactions
CREATE POLICY "Users can add own reactions"
  ON chat_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cp.conversation_id = cm.conversation_id
      WHERE cm.id = chat_reactions.message_id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
    -- Cannot react to deleted messages
    AND NOT EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = chat_reactions.message_id
        AND cm.deleted_at IS NOT NULL
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON chat_reactions FOR DELETE
  USING (user_id = auth.uid());
```

### 3. Update send_message RPC — add reply support

```sql
DROP FUNCTION IF EXISTS send_message(uuid, text, text, text, text, integer);
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

  -- Validate reply target belongs to same conversation
  IF p_reply_to_message_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM chat_messages
      WHERE id = p_reply_to_message_id
        AND conversation_id = p_conversation_id
    ) THEN
      RAISE EXCEPTION 'Reply target not found in this conversation';
    END IF;
  END IF;

  -- Insert message
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
```

### 4. Create delete_message RPC

```sql
CREATE FUNCTION delete_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_media_path text;
  v_thumbnail_path text;
BEGIN
  -- Verify ownership and get media paths for cleanup
  SELECT media_storage_path, media_thumbnail_path
  INTO v_media_path, v_thumbnail_path
  FROM chat_messages
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or not authorized';
  END IF;

  -- Soft delete: clear content, set deleted_at
  UPDATE chat_messages
  SET
    content = NULL,
    media_storage_path = NULL,
    media_thumbnail_path = NULL,
    media_duration_ms = NULL,
    deleted_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid();

  -- Note: storage file cleanup happens client-side after this RPC succeeds
  -- (we return the paths so the client can delete them)
END;
$$;
```

Actually, since SECURITY INVOKER can't delete storage files server-side, let's return the paths so the client can clean up:

```sql
DROP FUNCTION IF EXISTS delete_message(uuid);
CREATE FUNCTION delete_message(p_message_id uuid)
RETURNS TABLE (media_path text, thumbnail_path text)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE id = p_message_id
      AND sender_id = auth.uid()
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Message not found or not authorized';
  END IF;

  -- Return media paths for client-side cleanup
  RETURN QUERY
  SELECT cm.media_storage_path, cm.media_thumbnail_path
  FROM chat_messages cm
  WHERE cm.id = p_message_id;

  -- Soft delete
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
```

### 5. Create toggle_reaction RPC

```sql
CREATE FUNCTION toggle_reaction(p_message_id uuid, p_emoji text)
RETURNS boolean  -- true = added, false = removed
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_existing_id uuid;
  v_conversation_id uuid;
BEGIN
  -- Get conversation_id and verify message exists and isn't deleted
  SELECT cm.conversation_id INTO v_conversation_id
  FROM chat_messages cm
  WHERE cm.id = p_message_id
    AND cm.deleted_at IS NULL;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Message not found or deleted';
  END IF;

  -- Verify user is active participant
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  -- Check if reaction exists
  SELECT id INTO v_existing_id
  FROM chat_reactions
  WHERE message_id = p_message_id
    AND user_id = auth.uid()
    AND emoji = p_emoji;

  IF v_existing_id IS NOT NULL THEN
    -- Remove existing reaction
    DELETE FROM chat_reactions WHERE id = v_existing_id;
    RETURN false;
  ELSE
    -- Add new reaction
    INSERT INTO chat_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, auth.uid(), p_emoji);
    RETURN true;
  END IF;
END;
$$;
```

### 6. Update get_messages RPC — add reply data and reactions

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
  sender_profile_picture text,
  message_type text,
  media_storage_path text,
  media_thumbnail_path text,
  media_duration_ms integer,
  link_preview jsonb,
  deleted_at timestamptz,
  reply_to_message_id uuid,
  reply_to_content text,
  reply_to_sender_name text,
  reply_to_message_type text,
  reply_to_deleted_at timestamptz,
  reactions jsonb  -- [{emoji, count, user_reacted}]
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
    cm.link_preview,
    cm.deleted_at,
    cm.reply_to_message_id,
    reply_msg.content AS reply_to_content,
    reply_user.display_name AS reply_to_sender_name,
    reply_msg.message_type AS reply_to_message_type,
    reply_msg.deleted_at AS reply_to_deleted_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'emoji', r.emoji,
        'count', r.cnt,
        'user_reacted', r.user_reacted
      ))
      FROM (
        SELECT
          cr.emoji,
          COUNT(*) AS cnt,
          bool_or(cr.user_id = auth.uid()) AS user_reacted
        FROM chat_reactions cr
        WHERE cr.message_id = cm.id
        GROUP BY cr.emoji
        ORDER BY MIN(cr.created_at)
      ) r),
      '[]'::jsonb
    ) AS reactions
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  LEFT JOIN chat_messages reply_msg ON reply_msg.id = cm.reply_to_message_id
  LEFT JOIN users reply_user ON reply_user.id = reply_msg.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;
```

---

## Mobile Implementation

### Updated Types

```ts
// types/chat.ts — additions

export type ReactionSummary = {
  emoji: string;
  count: number;
  user_reacted: boolean;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  sender_display_name: string;
  sender_profile_picture: string | null;
  message_type: MessageType;
  media_storage_path: string | null;
  media_thumbnail_path: string | null;
  media_duration_ms: number | null;
  link_preview: LinkPreview | null;
  deleted_at: string | null;
  reply_to_message_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_name: string | null;
  reply_to_message_type: MessageType | null;
  reply_to_deleted_at: string | null;
  reactions: ReactionSummary[];
  // Client-only fields:
  _localMediaUri?: string;
  _localThumbnailUri?: string;
  _isUploading?: boolean;
  _isFetchingPreview?: boolean;
};
```

### File Structure

```
mobile/
  database/
    chat/
      delete-message.ts           -- NEW
      toggle-reaction.ts          -- NEW
      forward-message.ts          -- NEW
      send-message.ts             -- Updated: add reply_to_message_id param
      get-messages.ts             -- Updated: return new fields
  features/
    chat/
      hooks/
        useSendMessage.ts         -- Updated: accept replyToMessageId
        useSendMediaMessage.ts    -- Updated: accept replyToMessageId
        useDeleteMessage.ts       -- NEW
        useToggleReaction.ts      -- NEW
        useForwardMessage.ts      -- NEW
        useChatRealtime.ts        -- Updated: subscribe to reactions table too
      components/
        ChatBubble.tsx            -- Updated: show reply preview, deleted state, reactions
        ChatInput.tsx             -- Updated: show reply preview bar
        MessageToolbar.tsx        -- NEW: top toolbar with actions
        ReactionBar.tsx           -- NEW: quick emoji row in toolbar
        ReactionPills.tsx         -- NEW: reaction display below bubble
        ReplyPreview.tsx          -- NEW: quoted reply inside bubble
        ReplyInputBar.tsx         -- NEW: reply preview above input
```

### Component Details

#### MessageToolbar — New

Rendered at the top of the chat screen when a message is long-pressed. Animated slide-down entry.

```tsx
type MessageToolbarProps = {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onDismiss: () => void;
};
```

- Row of action buttons with icons + labels
- Below the actions: a row of quick-reaction emojis
- Backdrop overlay (semi-transparent) — tapping it dismisses
- Animated with `react-native-reanimated` (slide down from top, fade in backdrop)

#### ReplyPreview — New

Displayed inside a ChatBubble when the message is a reply.

```tsx
type ReplyPreviewProps = {
  senderName: string | null;
  content: string | null;
  messageType: MessageType | null;
  isDeleted: boolean;
  onPress: () => void;  // scroll to original message
};
```

- Left border accent (cyan/blue bar)
- Sender name in bold
- Content preview (2 lines max, or media type label, or "This message was deleted")
- Tappable — triggers scroll-to-message

#### ReplyInputBar — New

Shown above ChatInput when the user taps Reply.

```tsx
type ReplyInputBarProps = {
  message: ChatMessage;
  onDismiss: () => void;
};
```

- "Replying to {name}" header
- Content preview (truncated)
- X button to cancel reply

#### ReactionPills — New

Displayed below the message bubble.

```tsx
type ReactionPillsProps = {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
  onLongPress: (emoji: string) => void;  // show who reacted
  alignRight: boolean;  // own messages align right
};
```

- Row of pills: `[emoji count]`
- Own-reacted pills have a highlighted border (blue)
- Tapping toggles the reaction
- Wraps to next line if many reactions

#### ChatBubble — Updated

Changes:
1. **Deleted messages**: If `deleted_at` is set, render italic gray "This message was deleted" — no actions available
2. **Reply preview**: If `reply_to_message_id` is set, render `ReplyPreview` above the message content
3. **Reactions**: Render `ReactionPills` below the bubble
4. **Long press**: Calls `onLongPress(message)` prop to trigger the toolbar

#### ChatInput — Updated

Changes:
1. Accept `replyTo: ChatMessage | null` and `onCancelReply: () => void` props
2. When `replyTo` is set, render `ReplyInputBar` above the input area
3. Pass `replyToMessageId` through when sending

### Hooks

#### useDeleteMessage — New

```ts
function useDeleteMessage(conversationId: string) {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await deleteMessage(messageId);
      // Clean up storage files if media was attached
      if (result.media_path) {
        await supabase.storage.from("chat-media").remove([result.media_path]);
      }
      if (result.thumbnail_path) {
        await supabase.storage.from("chat-media").remove([result.thumbnail_path]);
      }
      return result;
    },
    onMutate: async (messageId) => {
      // Optimistic: mark message as deleted in cache
      // Set deleted_at, clear content/media
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
```

#### useToggleReaction — New

```ts
function useToggleReaction(conversationId: string) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      // Optimistic: toggle reaction in cache
      // If user_reacted, remove and decrement count
      // If !user_reacted, add and increment count
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}
```

#### useForwardMessage — New

```ts
function useForwardMessage() {
  return useMutation({
    mutationFn: async ({
      message,
      targetConversationId,
    }: {
      message: ChatMessage;
      targetConversationId: string;
    }) => {
      return sendMessage({
        conversationId: targetConversationId,
        content: message.content,
        messageType: message.message_type as MessageType,
        mediaStoragePath: message.media_storage_path,
        mediaThumbnailPath: message.media_thumbnail_path,
        mediaDurationMs: message.media_duration_ms,
      });
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: t("chat.messageForwarded") });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
```

#### useChatRealtime — Updated

Add subscription for `chat_reactions` table changes:

```ts
// In addition to existing chat_messages subscription:
channel.on(
  "postgres_changes",
  {
    event: "*",  // INSERT, DELETE
    schema: "public",
    table: "chat_reactions",
    filter: `message_id=in.(${messageIds})`,  // tricky — see note below
  },
  () => {
    // Simplest approach: invalidate messages query to refetch reactions
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
  }
);
```

**Note on reaction realtime**: Filtering reactions by message IDs in the current page is complex. Simpler approach: subscribe to `chat_reactions` with a filter on `message_id` referencing messages in this conversation. Since Supabase doesn't support join-based filters in realtime, the pragmatic approach is:

- Option A: Subscribe to ALL changes on `chat_reactions` and filter client-side (noisy for heavy usage, fine for 1-on-1 chat)
- Option B: On new reaction, just invalidate the messages query (refetch includes updated reaction counts)

**Recommended: Option B** — invalidate on any reaction change. Simple, correct, minimal extra traffic for 1-on-1 chats.

Actually even simpler: subscribe to `chat_messages` UPDATE events (which we might already do for link_preview). When a reaction is added/removed, the `get_messages` query returns updated reaction data on next fetch. We just need to invalidate when we detect a reaction happened. Since the reaction table is separate, use a channel on `chat_reactions` filtered by conversation (via a view or just broad subscription).

**Simplest correct approach**: Don't subscribe to reactions in realtime at all. Instead:
- When the current user toggles a reaction, update the cache optimistically
- When the user opens/returns to the chat, reactions are fetched fresh with `get_messages`
- For incoming reactions from the other user, they'll appear on next message fetch (which happens when a new message arrives via realtime, triggering invalidation)

This is good enough for 1-on-1 chat. Reactions from the other person appear within seconds (whenever the next message or refocus happens).

### Chat Detail Screen — Updated

The `[conversationId]/index.tsx` screen gains:

```tsx
const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
const flatListRef = useRef<FlatList>(null);

// Scroll to message (for tapping reply preview)
const scrollToMessage = (messageId: string) => {
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    // Briefly highlight the message (use a state + timeout)
  }
};
```

- `selectedMessage` controls toolbar visibility
- `replyTo` controls reply input bar
- Long press on bubble → `setSelectedMessage(message)`
- Toolbar Reply → `setReplyTo(message); setSelectedMessage(null)`
- Toolbar Copy → `Clipboard.setStringAsync(message.content); setSelectedMessage(null)`
- Toolbar Forward → open FriendPickerSheet, on select → forward → dismiss
- Toolbar Delete → confirmation alert → delete → dismiss

---

## Translations

### `locales/en/chat.json` — additions
```json
{
  "reply": "Reply",
  "copy": "Copy",
  "forward": "Forward",
  "delete": "Delete",
  "deleteConfirmTitle": "Delete message",
  "deleteConfirmMessage": "This message will be deleted for everyone.",
  "messageDeleted": "This message was deleted",
  "messageForwarded": "Message forwarded",
  "messageCopied": "Message copied",
  "replyingTo": "Replying to {{name}}",
  "forwardTo": "Forward to",
  "photo": "Photo",
  "video": "Video",
  "voiceMessage": "Voice message"
}
```

### `locales/fi/chat.json` — additions
```json
{
  "reply": "Vastaa",
  "copy": "Kopioi",
  "forward": "Välitä",
  "delete": "Poista",
  "deleteConfirmTitle": "Poista viesti",
  "deleteConfirmMessage": "Tämä viesti poistetaan kaikilta.",
  "messageDeleted": "Tämä viesti on poistettu",
  "messageForwarded": "Viesti välitetty",
  "messageCopied": "Viesti kopioitu",
  "replyingTo": "Vastaat käyttäjälle {{name}}",
  "forwardTo": "Välitä",
  "photo": "Kuva",
  "video": "Video",
  "voiceMessage": "Ääniviesti"
}
```

---

## Implementation Order

### Step 1: Database migration
- Add `reply_to_message_id` and `deleted_at` columns to `chat_messages`
- Create `chat_reactions` table with RLS
- Update `send_message` RPC with reply param
- Create `delete_message` RPC
- Create `toggle_reaction` RPC
- Update `get_messages` RPC to return reply data + reactions
- Push migration

### Step 2: Update types & database functions
- Update `ChatMessage` type with new fields
- Add `ReactionSummary` type
- Create `delete-message.ts`, `toggle-reaction.ts`, `forward-message.ts` database functions
- Update `send-message.ts` with `replyToMessageId` param

### Step 3: Message toolbar + long press
- Create `MessageToolbar` component
- Add long press handler to `ChatBubble`
- Add backdrop overlay to chat screen
- Wire up Copy action (simplest, immediate feedback)

### Step 4: Reply feature
- Create `ReplyPreview` component (inside bubble)
- Create `ReplyInputBar` component (above input)
- Update `ChatBubble` to render reply preview
- Update `ChatInput` to show reply bar
- Update `useSendMessage` and `useSendMediaMessage` to accept `replyToMessageId`
- Add scroll-to-message on reply preview tap

### Step 5: Delete feature
- Create `useDeleteMessage` hook
- Wire up delete action in toolbar with confirmation alert
- Update `ChatBubble` to render deleted state
- Handle media cleanup on delete

### Step 6: Forward feature
- Create `useForwardMessage` hook
- Wire up forward action → FriendPickerSheet → `getOrCreateDm` → send
- Add success toast

### Step 7: Emoji reactions
- Create `ReactionPills` component
- Create `ReactionBar` component (in toolbar)
- Create `useToggleReaction` hook
- Add reaction display below bubbles
- Add optimistic updates for toggling

### Step 8: Polish
- Animations for toolbar entrance/exit
- Haptic feedback on long press
- Handle edge cases (deleted replied-to messages, forwarding media)
- Translations
- Test all flows end-to-end

---

## Edge Cases

- **Delete a message someone replied to**: The reply preview shows "This message was deleted" — the reply itself remains intact
- **Forward a media message**: Uses the same `media_storage_path` — works because both conversations' participants can read from `chat-media` bucket (the file is in the sender's folder, and the storage RLS allows reading from conversation partners)
- **Forward to a new friend (no existing DM)**: Use `getOrCreateDm` first to create the conversation, then send
- **React to a deleted message**: Prevented by the `toggle_reaction` RPC (checks `deleted_at IS NULL`)
- **Long press on a deleted message**: Toolbar doesn't appear (no actions available)
- **Multiple rapid reaction toggles**: Optimistic updates prevent UI lag; `onSettled` invalidation ensures consistency
- **Scroll to replied message that's not loaded**: If the original message is beyond the loaded pages, `scrollToIndex` won't find it. For v1: do nothing (the message is old). Future: could fetch the specific message and scroll to it
- **Copy on media messages**: Copy button hidden — nothing useful to copy
- **Forward a voice message**: Works — same storage path reference. Duration is preserved
- **Conversation is inactive (unfriended)**: Toolbar still shows Copy. Reply/Forward/Delete/React are disabled
