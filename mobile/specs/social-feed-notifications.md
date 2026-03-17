# Social Feed Notifications

## Overview

Integrate push notifications and in-app notification bell for social feed interactions: likes, comments, and comment replies. The existing notification infrastructure (Supabase webhooks -> Edge Function -> Expo Push + `notifications` table -> realtime bell) is reused. Only the edge function needs new handlers, plus client-side additions for new notification types.

---

## Notification Types

| Event | Recipient | Title | Body | `type` value | Navigation |
|-------|-----------|-------|------|-------------|------------|
| Like on post | Post author | "New Like" | "{name} liked your post" | `feed_like` | Feed (social) |
| Comment on post | Post author | "New Comment" | "{name} commented on your post" | `feed_comment` | Feed (social) |
| Reply to comment | Parent comment author | "New Reply" | "{name} replied to your comment" | `feed_reply` | Feed (social) |

**Self-notification prevention**: Never notify a user about their own actions (liking own post, commenting on own post, replying to own comment).

---

## Backend Changes

### 1. Supabase Database Webhooks (Dashboard)

Create two new webhooks in the Supabase Dashboard (Database > Webhooks):

**Webhook: `feed_likes_notify`**
- Table: `feed_likes`
- Events: `INSERT`
- Type: Supabase Edge Function
- Function: `send-push-notification`
- Headers: `x-webhook-secret` = existing secret

**Webhook: `feed_comments_notify`**
- Table: `feed_comments`
- Events: `INSERT`
- Type: Supabase Edge Function
- Function: `send-push-notification`
- Headers: `x-webhook-secret` = existing secret

### 2. Update Edge Function: `send-push-notification/index.ts`

The existing function routes by `payload.table` and `payload.type`. Add new table handlers.

#### Updated WebhookPayload type

The current interface only has `friend_requests` fields. Make it generic:

```typescript
interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}
```

#### New routing in main handler

```typescript
// Existing friend_requests handlers...

if (payload.type === "INSERT" && payload.table === "feed_likes") {
  await handleFeedLike(supabase, payload.record);
}

if (payload.type === "INSERT" && payload.table === "feed_comments") {
  await handleFeedComment(supabase, payload.record);
}
```

#### `handleFeedLike`

```typescript
async function handleFeedLike(supabase, record) {
  const likerId = record.user_id;
  const feedItemId = record.feed_item_id;

  // Get the feed item to find the post author
  const { data: feedItem } = await supabase
    .from("feed_items")
    .select("user_id, title")
    .eq("id", feedItemId)
    .single();

  if (!feedItem) return;

  // Don't notify yourself
  if (feedItem.user_id === likerId) return;

  // Get liker's display name
  const { data: liker } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", likerId)
    .single();

  const likerName = liker?.display_name ?? "Someone";

  // Get post author's push tokens
  const { data: tokens } = await supabase
    .from("user_push_mobile_subscriptions")
    .select("token")
    .eq("user_id", feedItem.user_id)
    .eq("is_active", true);

  // Insert in-app notification
  await supabase.from("notifications").insert({
    user_id: feedItem.user_id,
    type: "feed_like",
    title: "New Like",
    body: `${likerName} liked your post`,
    data: {
      feedItemId,
      likerId,
      likerName,
    },
  });

  // Send push
  if (tokens && tokens.length > 0) {
    const messages = tokens.map((t) => ({
      to: t.token,
      title: "New Like",
      body: `${likerName} liked your post`,
      data: { type: "feed_like", feedItemId },
      channelId: "social",
      sound: "default",
    }));
    await sendExpoPushNotifications(messages);
  }
}
```

#### `handleFeedComment`

This handles both top-level comments (notify post author) and replies (notify parent comment author).

```typescript
async function handleFeedComment(supabase, record) {
  const commenterId = record.user_id;
  const feedItemId = record.feed_item_id;
  const parentId = record.parent_id; // null for top-level comments

  // Get commenter's display name
  const { data: commenter } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", commenterId)
    .single();

  const commenterName = commenter?.display_name ?? "Someone";

  if (parentId) {
    // REPLY: notify the parent comment author
    const { data: parentComment } = await supabase
      .from("feed_comments")
      .select("user_id")
      .eq("id", parentId)
      .single();

    if (!parentComment) return;
    if (parentComment.user_id === commenterId) return; // Don't notify yourself

    const { data: tokens } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("token")
      .eq("user_id", parentComment.user_id)
      .eq("is_active", true);

    await supabase.from("notifications").insert({
      user_id: parentComment.user_id,
      type: "feed_reply",
      title: "New Reply",
      body: `${commenterName} replied to your comment`,
      data: {
        feedItemId,
        commentId: record.id,
        commenterId,
        commenterName,
      },
    });

    if (tokens && tokens.length > 0) {
      const messages = tokens.map((t) => ({
        to: t.token,
        title: "New Reply",
        body: `${commenterName} replied to your comment`,
        data: { type: "feed_reply", feedItemId },
        channelId: "social",
        sound: "default",
      }));
      await sendExpoPushNotifications(messages);
    }
  } else {
    // TOP-LEVEL COMMENT: notify the post author
    const { data: feedItem } = await supabase
      .from("feed_items")
      .select("user_id")
      .eq("id", feedItemId)
      .single();

    if (!feedItem) return;
    if (feedItem.user_id === commenterId) return; // Don't notify yourself

    const { data: tokens } = await supabase
      .from("user_push_mobile_subscriptions")
      .select("token")
      .eq("user_id", feedItem.user_id)
      .eq("is_active", true);

    await supabase.from("notifications").insert({
      user_id: feedItem.user_id,
      type: "feed_comment",
      title: "New Comment",
      body: `${commenterName} commented on your post`,
      data: {
        feedItemId,
        commentId: record.id,
        commenterId,
        commenterName,
      },
    });

    if (tokens && tokens.length > 0) {
      const messages = tokens.map((t) => ({
        to: t.token,
        title: "New Comment",
        body: `${commenterName} commented on your post`,
        data: { type: "feed_comment", feedItemId },
        channelId: "social",
        sound: "default",
      }));
      await sendExpoPushNotifications(messages);
    }
  }
}
```

### 3. Edge Function: Service Role Access

The edge function uses `SUPABASE_SERVICE_ROLE_KEY` (already configured), which bypasses RLS. This is necessary because the webhook payload only contains the raw record — the function needs to look up related data (feed item author, parent comment author, user names, push tokens) across tables.

No migration changes needed — the `notifications` table, push tokens table, and realtime subscription already exist.

---

## Mobile Changes

### 1. Notification Bell — New Icons

`features/navbar/notificationBell.tsx` — update `getNotificationIcon`:

```typescript
import { Heart, MessageCircle, Reply } from "lucide-react-native";

case "feed_like":
  return <Heart size={18} color="#ef4444" />;
case "feed_comment":
  return <MessageCircle size={18} color="#3b82f6" />;
case "feed_reply":
  return <Reply size={18} color="#8b5cf6" />;
```

### 2. Notification Bell — Navigation Targets

`features/navbar/notificationBell.tsx` — update `getNavigationTarget`:

```typescript
case "feed_like":
case "feed_comment":
case "feed_reply":
  return "/"; // Navigate to main feed (social mode)
```

### 3. Push Notification Navigation

`features/notifications/getRouteForNotification.ts` — add:

```typescript
if (data.type === "feed_like" || data.type === "feed_comment" || data.type === "feed_reply") {
  return "/";
}
```

### 4. Translations

#### `locales/en/notifications.json` — add:

```json
{
  "notifications": {
    "feedLikeTitle": "New Like",
    "feedCommentTitle": "New Comment",
    "feedReplyTitle": "New Reply"
  }
}
```

#### `locales/fi/notifications.json` — add:

```json
{
  "notifications": {
    "feedLikeTitle": "Uusi tykkäys",
    "feedCommentTitle": "Uusi kommentti",
    "feedReplyTitle": "Uusi vastaus"
  }
}
```

### 5. Realtime Subscription

No changes needed. The existing `useNotificationSubscription` already listens for all INSERTs on the `notifications` table filtered by `user_id`. New notification types automatically appear in the bell.

---

## Design Decisions

### Why not batch like notifications?

Like batching ("3 people liked your post") adds complexity (aggregation logic, debounce timers, update-vs-insert decisions in the edge function). For v1, one notification per like is simpler and can be refined later if users report noise. Users can mark all as read to clear them.

### Why not notify post author when someone replies to another person's comment?

Keeps notification volume lower. The post author already gets notified about top-level comments. If a discussion develops in replies, only the direct parent comment author is notified. This can be revisited.

### Why route all social notifications to `/` (feed)?

The feed page is where all social content lives. The `feedItemId` is included in the notification data for future enhancement (auto-scroll to post, auto-open comment sheet), but for v1 simply opening the feed is sufficient.

### Why no new Android notification channel?

The existing `"social"` channel (HIGH importance) is already used for friend requests. All social feed notifications belong in the same channel.

---

## Implementation Order

### Step 1: Edge Function Update
- Update `WebhookPayload` interface to be generic
- Add `handleFeedLike` handler
- Add `handleFeedComment` handler (handles both comments and replies)
- Deploy with `supabase functions deploy send-push-notification`

### Step 2: Supabase Webhooks
- Create webhook on `feed_likes` table (INSERT) -> `send-push-notification`
- Create webhook on `feed_comments` table (INSERT) -> `send-push-notification`
- Both use same `x-webhook-secret` header

### Step 3: Client — Notification Bell Updates
- Add icons for `feed_like`, `feed_comment`, `feed_reply` in `notificationBell.tsx`
- Add navigation targets for new types in `notificationBell.tsx`

### Step 4: Client — Push Navigation
- Add new types to `getRouteForNotification.ts`

### Step 5: Translations
- Add new keys to `en/notifications.json` and `fi/notifications.json`

### Step 6: Test
- Like a friend's post -> post author gets push + bell notification
- Comment on a friend's post -> post author gets push + bell notification
- Reply to someone's comment -> parent comment author gets push + bell notification
- Like/comment on own post -> no notification
- Reply to own comment -> no notification

---

## Edge Cases

- **User unlikes then relikes**: Each like INSERT triggers a notification. The unlike (DELETE) does not. Rapid toggling could cause duplicate notifications — acceptable for v1, can add dedup later.
- **Comment deleted after notification sent**: Notification persists in bell. Tapping it navigates to feed where the comment no longer exists — harmless.
- **Post visibility changed to private after notification**: Notification still shows in bell but the post is no longer visible in the feed. The notification is a historical record.
- **User has push disabled**: No push token in `user_push_mobile_subscriptions`, so no push sent. In-app notification still inserted and visible in bell.
- **Multiple devices**: Push sent to all active tokens (existing pattern handles this).

---

## Future Enhancements

- **Like batching**: "User and 2 others liked your post" — aggregate recent likes into one notification.
- **Deep link to specific post**: Use `feedItemId` from notification data to scroll to the post and optionally open the comment sheet.
- **Mute post notifications**: Per-post toggle to stop receiving notifications for a specific feed item.
- **Notification preferences**: Settings to toggle social notifications on/off by type (likes, comments, replies).
