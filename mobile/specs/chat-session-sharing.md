# Chat Session Sharing

## Overview

Share gym sessions and activity sessions as interactive cards in chat. Instead of sending a flat screenshot image, send a rich preview card that the recipient can tap to open the full session in read-only mode — the same experience as tapping "Details" on the social feed, but accessible directly from a DM conversation.

This works for **both gym sessions and activity sessions**, and does not require the session to be shared on the public friends feed.

---

## Current behavior

1. User finishes session → sees share modal with customized PNG card
2. "Send to Chat" captures the card as an image → uploads to `chat-media` → sends as `message_type: "image"`
3. Friend sees a flat image in chat — looks nice but no interaction beyond zooming

## New behavior

1. User taps "Send to Chat" (same button as before — no new buttons added)
2. A **share type picker** appears with two options:
   - **Share as Image** — current behavior (sends the customized PNG card)
   - **Share Session** — new (sends an interactive session card the friend can tap to view full details)
3. After picking, the friend picker opens as usual
4. If "Share Session" was chosen, the friend sees a rich preview card in chat → tapping opens the full read-only session (map, exercises, media, all stats)

---

## Features

### 1. New message type: `session_share`

A new `message_type` value for chat messages. The `content` field stores a JSON string with preview data so the card renders instantly without an API call.

**Content JSON structure:**
```json
{
  "session_type": "gym_sessions",
  "source_id": "uuid-of-the-session",
  "feed_item_id": "uuid-of-feed-item-or-null",
  "title": "Push Day",
  "stats": {
    "duration": 3845,
    "exercises_count": 6,
    "sets_count": 18,
    "total_volume": 12500
  }
}
```

For activity sessions:
```json
{
  "session_type": "activity_sessions",
  "source_id": "uuid-of-the-session",
  "feed_item_id": "uuid-of-feed-item-or-null",
  "title": "Evening Run",
  "activity_name": "Running",
  "stats": {
    "duration": 1823,
    "distance_meters": 5230,
    "avg_pace": 348,
    "calories": 412,
    "steps": 6200
  }
}
```

- No `media_storage_path` needed — this is metadata only
- `feed_item_id` is included when the session has been shared to the feed; null for private sessions

### 2. Session share card in chat

A new component `ChatSessionCard` rendered inside `ChatBubble` when `message_type === "session_share"`.

```
+----------------------------------+
|  [Gym icon]  Gym Session         |  ← type badge
|                                  |
|  Push Day                        |  ← title (AppText)
|                                  |
|  Duration    Exercises    Sets   |
|  1h 04m      6            18    |  ← stat row (BodyText)
|                                  |
|  Tap to view details →           |  ← hint (BodyTextNC, muted)
+----------------------------------+
```

For activity sessions:
```
+----------------------------------+
|  [Activity icon]  Running        |  ← activity name badge
|                                  |
|  Evening Run                     |  ← title
|                                  |
|  Distance    Duration    Pace    |
|  5.23 km     30:23      5:48/km |  ← stat row
|                                  |
|  Tap to view details →           |  ← hint
+----------------------------------+
```

**Card styling:**
- Fixed width matching media bubbles (~280px)
- Rounded corners, matching chat bubble rounding
- Subtle gradient background (blue tint for gym, green tint for activities — same as `SocialFeedCard`)
- Sender's bubble uses the card with no chat bubble background (card IS the bubble)
- Receiver's bubble same approach

**Stat display rules:**
- Gym: always show Duration, Exercises, Sets. Show Total Volume if > 0
- Activity: show Duration always. Show Distance, Pace, Calories, Steps only if > 0. Max 4 stats

### 3. Tapping the card → full session view

Tapping `ChatSessionCard` opens a full-screen modal with the session in read-only mode.

**Data fetching:**
- Gym: calls `get_friend_gym_session_by_chat(p_session_id, p_conversation_id)` — new RPC
- Activity: calls `get_friend_activity_session_by_chat(p_session_id, p_conversation_id)` — new RPC
- Shows loading spinner while fetching
- On error, shows inline error with retry

**Display:**
- Gym sessions: render `<GymSession {...data} readOnly />` in a modal
- Activity sessions: render `<ActivitySession {...data} readOnly />` in a modal
- Same full experience as viewing from the social feed

### 4. Authorization via chat

The existing `get_friend_*_session` RPCs require `feed_items.visibility = 'friends'`. For chat-shared sessions, we need a separate authorization path that doesn't depend on feed visibility.

**New RPC functions:**

```sql
-- For gym sessions shared via chat
CREATE FUNCTION get_friend_gym_session_by_chat(
  p_session_id uuid,
  p_conversation_id uuid,
  p_language text DEFAULT 'en'
) RETURNS jsonb

-- For activity sessions shared via chat
CREATE FUNCTION get_friend_activity_session_by_chat(
  p_session_id uuid,
  p_conversation_id uuid
) RETURNS jsonb
```

**Authorization logic:**
1. Verify caller is a participant in `p_conversation_id` (via `chat_participants`)
2. Verify a `session_share` message exists in that conversation referencing `p_session_id`
3. If both pass → return full session data (same query as existing friend RPCs)
4. Otherwise → raise exception

This means:
- Private sessions can be shared in chat without appearing on the feed
- Only the conversation participants can view the session
- The share message itself acts as the authorization token

### 5. Share type picker

When the user taps "Send to Chat" (existing button in `ShareModalShell` and the activity/gym finished screens), a **share type picker** step is inserted before the friend picker.

```
+------------------------------------------+
|  ← Back                                  |
|                                          |
|  How do you want to share?               |
|                                          |
|  +--------------------------------------+|
|  | [Image icon]  Share as Image         ||
|  | Sends the customized card as a photo ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | [Activity icon]  Share Session       ||
|  | Friend can tap to view full details  ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
```

**Flow:**
1. User taps "Send to Chat"
2. If in `ShareModalShell`: capture the PNG card first (needed if they pick image), then show the share type picker
3. User picks "Share as Image" or "Share Session"
4. Friend picker opens
5. User picks a friend
6. Based on the choice:
   - **Image**: current flow — uploads PNG to `chat-media`, sends as `message_type: "image"`
   - **Session**: calls `sendSessionToChat(sessionId, sessionType, friendId, previewData)` which:
     - `getOrCreateDm(friendId)` → gets conversation ID
     - Builds the preview JSON from session summary data (already in the summary store)
     - Calls `sendMessage({ conversationId, content: JSON.stringify(preview), messageType: "session_share" })`
7. Shows success toast and stays on current screen

**Where this applies:**
- `ShareModalShell` — used when sharing from past session detail views (both gym and activity)
- `app/activities/activity-finished/index.tsx` — needs a "Send to Chat" button added (currently missing), which follows the same flow
- `app/gym/training-finished/index.tsx` — same as above

**Implementation:** Add a `ShareTypePicker` component that renders the two options. `ShareModalShell` gets a new state step: `showShareTypePicker` between the main view and `showFriendPicker`. The finished screens also use this component before opening the friend picker.

### 6. Message previews and conversation list

When `session_share` is the last message in a conversation, `ConversationItem` should show:
- Gym: "Gym session" (with dumbbell icon)
- Activity: "Activity session" (with activity icon)

Same approach in `ReplyPreview` / `ReplyInputBar` when replying to a session share.

### 7. Message toolbar actions

For `session_share` messages in the long-press toolbar:
- **Reply**: yes (quote shows session title)
- **Copy**: no (nothing useful to copy)
- **Forward**: no — the session was shared privately with this specific person. Forwarding would let someone re-share another user's session without their consent
- **Delete**: yes (own messages only, same as other types)

---

## Database changes

### Migration: update `send_message` RPC

Add `'session_share'` to the allowed `message_type` values:
```sql
IF p_message_type NOT IN ('text', 'image', 'video', 'voice', 'session_share') THEN
  RAISE EXCEPTION 'Invalid message type';
END IF;
```

For `session_share` type:
- `content` is required (the JSON preview data)
- `media_storage_path` must be null
- Validate that `content` is valid JSON and contains required fields (`session_type`, `source_id`, `title`)

### Migration: new RPC functions

`get_friend_gym_session_by_chat(p_session_id, p_conversation_id, p_language)`:
- Check caller is participant in conversation
- Check a session_share message exists in conversation with matching source_id in content
- Return same JSONB structure as `get_friend_gym_session`

`get_friend_activity_session_by_chat(p_session_id, p_conversation_id)`:
- Same authorization pattern
- Return same JSONB structure as `get_friend_activity_session`

Both functions: `SECURITY INVOKER`, use `auth.uid()`.

### TypeScript type changes

```typescript
// types/chat.ts
export type MessageType = "text" | "image" | "video" | "voice" | "session_share";

export type SessionShareContent = {
  session_type: "gym_sessions" | "activity_sessions";
  source_id: string;
  feed_item_id: string | null;
  title: string;
  activity_name?: string; // activity sessions only
  stats: Record<string, number>;
};
```

---

## New files

| File | Purpose |
|------|---------|
| `features/chat/components/ChatSessionCard.tsx` | Session preview card rendered in chat bubble |
| `lib/components/share/ShareTypePicker.tsx` | "Share as Image" vs "Share Session" picker shown before friend picker |
| `database/chat/send-session-share.ts` | Builds preview JSON + sends session_share message |
| `database/chat/get-shared-session.ts` | Calls the new by-chat RPCs + generates signed URLs |

## Modified files

| File | Change |
|------|--------|
| `types/chat.ts` | Add `"session_share"` to `MessageType`, add `SessionShareContent` type |
| `features/chat/components/ChatBubble.tsx` | Render `ChatSessionCard` for session_share type |
| `features/chat/components/ConversationItem.tsx` | Show "Gym session" / "Activity session" preview text |
| `features/chat/components/ReplyPreview.tsx` | Show session title for replied-to session shares |
| `features/chat/components/ReplyInputBar.tsx` | Show session title in reply compose bar |
| `features/chat/components/MessageToolbar.tsx` | Hide Copy for session_share messages |
| `lib/components/share/ShareModalShell.tsx` | Add `ShareTypePicker` step between "Send to Chat" tap and friend picker. Accept session data props for the session share path |
| `app/activities/activity-finished/index.tsx` | Add "Send to Chat" button (currently missing here) with share type picker + friend picker flow |
| `app/gym/training-finished/index.tsx` | Same — add "Send to Chat" button with the share type picker flow |
| `locales/en/chat.json` | Add translation keys for share type picker and session share UI |
| `locales/fi/chat.json` | Finnish translations |

## Migration file

`supabase/migrations/YYYYMMDDHHmmss_chat_session_sharing.sql`:
- Update `send_message` to allow `session_share` type with content validation
- Create `get_friend_gym_session_by_chat` RPC
- Create `get_friend_activity_session_by_chat` RPC

---

## Edge cases

- **Session deleted after sharing**: Card shows "Session no longer available" when tapped
- **Unfriended after sharing**: Card still visible in chat history, but tapping shows error since chat participant check still passes (unfriending sets `is_active = false` on chat_participants but doesn't remove them). The RPC checks conversation participation, not friendship — so this works correctly
- **Forwarding disabled**: Session shares cannot be forwarded — only the session owner can share their session with others
- **Multiple shares of same session**: Each creates a separate message. All recipients authorized independently
- **Session updated after sharing**: Tapping always fetches latest data from DB, so the friend sees the current version. Preview stats in the message are a snapshot — minor staleness is acceptable
