# Chat Media Messages

## Overview

Add image, video, and voice message support to the 1-on-1 chat feature. Each media item is sent as its own message (one media per message, no captions). The existing `MediaToolbar` component handles picking, compression, and size validation — we reuse it in the chat input area. Existing `ImageViewerModal`, `VideoPlayerModal`, and `DraftRecordingItem` components handle media display — we reuse or adapt them for chat bubbles.

---

## Design Decisions

### One media per message (Option A)

Each media attachment is its own message — no captions, no multi-media messages. This is the simplest model for both DB and UI:
- Sending an image = one `chat_messages` row with `message_type = 'image'`
- Sending a video = one row with `message_type = 'video'`
- Sending a voice message = one row with `message_type = 'voice'`
- Text messages remain unchanged (`message_type = 'text'`)

Users can still send text before/after a media message — they're just separate messages.

### Storage bucket

Create a new `chat-media` bucket. Separate from `notes-images`/`notes-voice`/`media-videos` because:
- Chat media needs different RLS: both participants in a conversation must read each other's uploads
- Chat media may have different retention/cleanup policies in the future
- Clean separation of concerns

All chat media types (images, videos, voice, thumbnails) live in the same bucket under type-based subfolders:
```
chat-media/{user_id}/images/{uuid}.jpg
chat-media/{user_id}/videos/{uuid}.mp4
chat-media/{user_id}/videos/{uuid}-thumb.jpg
chat-media/{user_id}/voice/{uuid}.m4a
```

### Upload-then-send flow

1. User picks/records media → compress
2. Upload to `chat-media` bucket → get storage path
3. Call `send_chat_message` RPC with media params → creates the message row
4. On failure at step 3: clean up orphaned storage files

This matches the existing pattern in `save-note.ts`.

### send_message RPC changes

The current `send_message` RPC only accepts text. Instead of modifying it (which would break the existing signature), create a **new** `send_chat_message` RPC that handles both text and media. This avoids needing to drop the old function and re-create, and keeps the migration clean.

Update: actually per CLAUDE.md rules we should `DROP FUNCTION` first then `CREATE FUNCTION` to avoid signature conflicts. We'll drop the old `send_message(uuid, text)` and create a new one with the expanded signature.

### Realtime for media messages

The existing realtime subscription on `chat_messages` INSERT already works — new media message rows arrive the same way. The `ChatBubble` just needs to render differently based on `message_type`. The realtime payload includes the new columns automatically since it sends the full row.

### Media limits for chat

Reuse the same compression settings from `MediaToolbar` / `MEDIA_LIMITS`. No per-conversation media count limits — users can send as many media messages as they want (each is a separate message). The per-message limits still apply:
- Images: compressed to 2048px max, ≤10 MB after compression, reject raw files >50 MB
- Videos: compressed to 720p/3Mbps, ≤100 MB, max 5 min duration
- Voice: max 30 min duration

---

## Database Schema

### Migration: `supabase/migrations/20260318200000_chat_media.sql`

### 1. Add columns to chat_messages

```sql
-- Add media columns to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN media_storage_path TEXT,
  ADD COLUMN media_thumbnail_path TEXT,
  ADD COLUMN media_duration_ms INTEGER;

-- Drop unused attachment_url column
ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_url;

-- Allow empty content for media messages (media-only, no caption)
-- Drop old constraint, add new one that allows empty content for media
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_check;
ALTER TABLE chat_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_check
  CHECK (
    (message_type = 'text' AND content IS NOT NULL AND char_length(content) BETWEEN 1 AND 2000)
    OR (message_type IN ('image', 'video', 'voice') AND media_storage_path IS NOT NULL)
  );

-- Index for filtering by type (optional, useful for future "show all photos" feature)
CREATE INDEX idx_chat_messages_type ON chat_messages(conversation_id, message_type)
  WHERE message_type != 'text';
```

### 2. Create chat-media storage bucket

```sql
-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  524288000, -- 500 MB (same as media-videos)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/m4a', 'audio/mp4', 'audio/x-m4a'
  ]
);

-- Upload: users can upload to their own folder
CREATE POLICY "Users can upload own chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Read: users can read media from conversations they participate in
-- Since storage path includes the uploader's user_id, we need to allow
-- reading other users' files if they share a conversation.
-- Simplest approach: allow reading any file in chat-media if the reader
-- shares a conversation with the file owner (folder = uploader's user_id).
CREATE POLICY "Users can read chat media from conversation partners"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-media'
    AND (
      -- Own files
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Files from users who share a conversation with you
      EXISTS (
        SELECT 1 FROM chat_participants cp1
        JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid()
          AND cp2.user_id = (storage.foldername(name))[1]::uuid
      )
    )
  );

-- Delete: users can only delete their own uploads
CREATE POLICY "Users can delete own chat media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3. Update send_message RPC

```sql
-- Drop old send_message and create new one with media support
DROP FUNCTION IF EXISTS send_message(uuid, text);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_media_storage_path text DEFAULT NULL,
  p_media_thumbnail_path text DEFAULT NULL,
  p_media_duration_ms integer DEFAULT NULL
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

  -- Insert message
  INSERT INTO chat_messages (
    conversation_id, sender_id, content,
    message_type, media_storage_path, media_thumbnail_path, media_duration_ms
  )
  VALUES (
    p_conversation_id, auth.uid(), p_content,
    p_message_type, p_media_storage_path, p_media_thumbnail_path, p_media_duration_ms
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

### 4. Update get_messages RPC

```sql
-- Drop and recreate with media columns
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
  media_duration_ms integer
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
    cm.media_duration_ms
  FROM chat_messages cm
  JOIN users u ON u.id = cm.sender_id
  WHERE cm.conversation_id = p_conversation_id
    AND (p_before IS NULL OR cm.created_at < p_before)
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;
```

### 5. Update get_conversations RPC

The last message preview should show a placeholder for media messages instead of empty content.

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
  last_message_type text,
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
    lm.message_type AS last_message_type,
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
    SELECT cm.content, cm.created_at, cm.sender_id, cm.message_type
    FROM chat_messages cm
    WHERE cm.conversation_id = cc.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE lm.created_at IS NOT NULL
  ORDER BY COALESCE(lm.created_at, cc.created_at) DESC;
END;
$$;
```

---

## Mobile Implementation

### Updated Types

```ts
// types/chat.ts

export type MessageType = "text" | "image" | "video" | "voice";

export type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string | null;
  updated_at: string;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  last_message_type: MessageType | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_profile_picture: string | null;
  is_active: boolean;
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
  // Client-only fields for optimistic updates:
  _localMediaUri?: string;
  _localThumbnailUri?: string;
  _uploadProgress?: number;
  _isUploading?: boolean;
};
```

### Updated File Structure

```
mobile/
  database/
    chat/
      send-message.ts              -- Updated: accept media params
      get-messages.ts              -- Updated: return media fields
      get-conversations.ts         -- Updated: return last_message_type
      (others unchanged)
  features/
    chat/
      hooks/
        useSendMessage.ts          -- Updated: handle media upload + send
        useSendMediaMessage.ts     -- NEW: separate hook for media message flow
        (others unchanged)
      components/
        ChatInput.tsx              -- Updated: add media button, show MediaToolbar
        ChatBubble.tsx             -- Updated: render based on message_type
        ChatMediaBubble.tsx        -- NEW: renders image/video/voice in bubble
        ChatVoicePlayer.tsx        -- NEW: compact voice player for chat bubbles
        ChatMediaPreview.tsx       -- NEW: preview strip above input before sending
        ConversationItem.tsx       -- Updated: media type in last message preview
```

### Database Functions Changes

#### `send-message.ts` — Updated
```ts
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { MessageType } from "@/types/chat";

type SendMessageParams = {
  conversationId: string;
  content?: string | null;
  messageType?: MessageType;
  mediaStoragePath?: string | null;
  mediaThumbnailPath?: string | null;
  mediaDurationMs?: number | null;
};

export async function sendMessage({
  conversationId,
  content = null,
  messageType = "text",
  mediaStoragePath = null,
  mediaThumbnailPath = null,
  mediaDurationMs = null,
}: SendMessageParams): Promise<string> {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_content: content,
    p_message_type: messageType,
    p_media_storage_path: mediaStoragePath,
    p_media_thumbnail_path: mediaThumbnailPath,
    p_media_duration_ms: mediaDurationMs,
  });

  if (error) {
    handleError(error, {
      message: "Error sending message",
      route: "/database/chat/send-message",
      method: "POST",
    });
    throw new Error("Error sending message");
  }

  return data as string;
}
```

### Component Details

#### ChatInput — Updated

Add a `+` button (or paperclip icon) to the left of the text input. Tapping it toggles the `MediaToolbar` visibility below the input area.

```
+------------------------------------------+
| [+]  [Type a message...]         [Send]  |
|------------------------------------------|
|  [Mic]  |  [Image]  |  [Video]           |   ← MediaToolbar (shown when + tapped)
+------------------------------------------+
```

- The `+` button toggles MediaToolbar visibility
- MediaToolbar is rendered without folder button (`showFolderButton={false}`)
- MediaToolbar is rendered without video count limits (no per-conversation cap)
- When media is selected/recorded, show `ChatMediaPreview` above the input
- Send button changes to upload+send the media

Props added to `ChatInput`:
- `onSendMedia: (params: MediaMessageParams) => void`

#### ChatMediaPreview — New

Shown above the input when the user has selected media but hasn't sent yet.

```
+------------------------------------------+
|  [X]  [image thumbnail / video thumb /   |
|        "Voice message 0:15"]             |
|------------------------------------------|
| [+]  [Type a message...]         [Send]  |
+------------------------------------------+
```

- Shows a thumbnail for images/videos, or duration label for voice
- X button to cancel/discard
- Tapping Send uploads the media then sends the message

#### ChatBubble — Updated

Renders differently based on `message_type`:

**Text** (unchanged):
```
+----------------------------+
|  Hey, how's it going?      |
+----------------------------+
```

**Image**:
```
+----------------------------+
|  [    image preview    ]   |
|  [     (tappable)      ]   |
+----------------------------+
```
- Shows compressed image in bubble (max width 240, aspect ratio preserved)
- Tap opens `ImageViewerModal` fullscreen

**Video**:
```
+----------------------------+
|  [   video thumbnail   ]   |
|  [      ▶ 0:45         ]   |
+----------------------------+
```
- Shows thumbnail with play button overlay and duration
- Tap opens `VideoPlayerModal` fullscreen

**Voice**:
```
+----------------------------+
|  ▶  ━━━━━━━━━━━  0:15     |
+----------------------------+
```
- Compact inline player with play/pause, progress bar, duration
- Uses `ChatVoicePlayer` — a simplified version of `DraftRecordingItem` that fits in a chat bubble

#### ChatVoicePlayer — New

A compact voice player designed for chat bubbles. Simpler than `DraftRecordingItem`:
- Play/pause button
- Progress bar (no drag-to-seek needed, just tap)
- Duration display
- No delete button
- Styled to fit inside a chat bubble (transparent background, matching text colors for own vs other bubble)

#### ConversationItem — Updated

When the last message is media, show a placeholder instead of content:

```ts
const lastMessagePreview = (() => {
  const type = conversation.last_message_type ?? "text";
  const prefix = conversation.last_message_sender_id === conversation.other_user_id
    ? ""
    : `${t("chat.you")}: `;

  if (type === "image") return `${prefix}${t("chat.mediaPhoto")}`;
  if (type === "video") return `${prefix}${t("chat.mediaVideo")}`;
  if (type === "voice") return `${prefix}${t("chat.mediaVoice")}`;
  return conversation.last_message_content
    ? `${prefix}${conversation.last_message_content}`
    : "";
})();
```

### Hooks

#### useSendMediaMessage — New

Handles the full upload-then-send flow for media messages.

```ts
export default function useSendMediaMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      messageType: "image" | "video" | "voice";
      uri: string;
      thumbnailUri?: string;
      durationMs?: number;
    }) => {
      const accessToken = await getAccessToken();
      const userId = useUserStore.getState().profile?.id;

      let storagePath: string;
      let thumbnailPath: string | null = null;

      // Upload based on type
      if (params.messageType === "image") {
        const ext = params.uri.split(".").pop()?.toLowerCase() ?? "jpg";
        storagePath = `${userId}/images/${Crypto.randomUUID()}.${ext}`;
        await uploadFileToStorage(
          "chat-media", storagePath, params.uri,
          ext === "png" ? "image/png" : "image/jpeg",
          accessToken,
        );
      } else if (params.messageType === "video") {
        storagePath = `${userId}/videos/${Crypto.randomUUID()}.mp4`;
        thumbnailPath = `${userId}/videos/${Crypto.randomUUID()}-thumb.jpg`;
        await uploadFileToStorage(
          "chat-media", storagePath, params.uri,
          "video/mp4", accessToken,
        );
        if (params.thumbnailUri) {
          await uploadFileToStorage(
            "chat-media", thumbnailPath, params.thumbnailUri,
            "image/jpeg", accessToken,
          );
        }
      } else {
        storagePath = `${userId}/voice/${Crypto.randomUUID()}.m4a`;
        await uploadFileToStorage(
          "chat-media", storagePath, params.uri,
          "audio/m4a", accessToken,
        );
      }

      // Send the message with media references
      return sendMessage({
        conversationId,
        messageType: params.messageType,
        mediaStoragePath: storagePath,
        mediaThumbnailPath: thumbnailPath,
        mediaDurationMs: params.durationMs ?? null,
      });
    },

    onMutate: async (params) => {
      // Optimistic update: show bubble with local URI immediately
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });
      // ... add optimistic message with _localMediaUri, _isUploading: true
    },

    onError: (err, params, context) => {
      // Rollback optimistic update
      // Clean up any uploaded files
      Toast.show({ type: "error", text1: t("chat.mediaUploadError") });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
```

#### useSendMessage — Updated

Update the existing text `sendMessage` call to use the new function signature:

```ts
mutationFn: (content: string) => sendMessage({
  conversationId,
  content,
  messageType: "text",
}),
```

Also update the optimistic message shape to include `message_type: "text"` and the new nullable fields.

### Media URL Resolution

Chat messages store `media_storage_path` (e.g., `{userId}/images/{uuid}.jpg`), not full URLs. To display media in bubbles, generate a signed URL or use `supabase.storage.from("chat-media").getPublicUrl(path)`.

Since the bucket is private, use signed URLs:

```ts
// Utility: get signed URL for chat media
export function getChatMediaUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("chat-media")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry
  return data?.signedUrl ?? "";
}
```

For performance, cache signed URLs in the component (they're valid for 1 hour). Use `useMemo` or a simple cache map.

### Realtime — No Changes Needed

The existing `useChatRealtime` subscription on `chat_messages` INSERT already picks up new rows. The payload includes all columns automatically (including `message_type`, `media_storage_path`, etc.). The only change is that `ChatBubble` renders differently based on the `message_type` field.

One consideration: the realtime payload for media messages won't include `sender_display_name` or `sender_profile_picture` (those come from the JOIN in `get_messages`). The existing code already handles this — it adds the raw payload to the cache, and the fields get filled on the next `invalidateQueries` call. For media messages, the bubble can render the media even without the sender info.

---

## Translations

### `locales/en/chat.json` — additions
```json
{
  "chat": {
    "mediaPhoto": "Photo",
    "mediaVideo": "Video",
    "mediaVoice": "Voice message",
    "mediaUploadError": "Failed to send media",
    "attachMedia": "Attach media",
    "sending": "Sending..."
  }
}
```

### `locales/fi/chat.json` — additions
```json
{
  "chat": {
    "mediaPhoto": "Kuva",
    "mediaVideo": "Video",
    "mediaVoice": "Ääniviesti",
    "mediaUploadError": "Median lähetys epäonnistui",
    "attachMedia": "Liitä media",
    "sending": "Lähetetään..."
  }
}
```

---

## Implementation Order

### Step 1: Database migration
- Add columns to `chat_messages` (message_type, media_storage_path, etc.)
- Create `chat-media` storage bucket with RLS policies
- Update `send_message` RPC with media params
- Update `get_messages` RPC to return media columns
- Update `get_conversations` RPC to return `last_message_type`
- Push migration

### Step 2: Update types & database functions
- Update `ChatMessage` and `Conversation` types
- Update `sendMessage` function signature
- Update `get-messages.ts` and `get-conversations.ts` (types only, data comes from RPC)

### Step 3: Update ChatBubble for media rendering
- Add `message_type` switch to ChatBubble
- Create `ChatMediaBubble` component for image/video rendering
- Create `ChatVoicePlayer` component for voice rendering
- Add signed URL utility for loading media from storage
- Test with manually inserted media messages

### Step 4: Update ChatInput with MediaToolbar
- Add attach button to ChatInput
- Integrate MediaToolbar (reuse from notes, hide folder button)
- Create `ChatMediaPreview` for the selected-but-not-sent state
- Wire up media selection callbacks

### Step 5: Implement send media flow
- Create `useSendMediaMessage` hook (upload + send)
- Update `useSendMessage` for new function signature
- Add optimistic updates for media messages (show local URI while uploading)
- Add error handling with storage cleanup

### Step 6: Update conversation list
- Update `ConversationItem` to show media type placeholders
- Update `Conversation` type usage

### Step 7: Polish
- Test all media types end-to-end
- Test with slow connections (upload progress)
- Test error cases (upload fails, send fails, bucket full)
- Test with unfriended user (is_active = false, can still see old media)
- Translations

---

## Edge Cases

- **Upload fails mid-way**: Show error toast, remove optimistic bubble, no orphan in DB (message wasn't created)
- **Upload succeeds but send_message fails**: Clean up the uploaded file from storage, show error toast
- **Large video on slow connection**: Show upload progress in the bubble, user can continue typing other messages while it uploads
- **Unfriended after media sent**: Media remains visible in history (storage READ policy checks conversation membership, which still exists even when `is_active = false`)
- **Expired signed URLs**: If a signed URL expires while the user is still viewing the chat, media will fail to load. Handle by regenerating the URL on image load error.
- **Realtime media messages from other user**: The realtime payload has `media_storage_path` — the receiving client generates a signed URL to display it. Works the same as fetched messages.
- **Voice message while recording**: Only one recording at a time (RecordingModal handles this). If the user navigates away, recording is cancelled.
- **Offline**: Media send fails immediately (upload requires network). Show error toast with retry.
