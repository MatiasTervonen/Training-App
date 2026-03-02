# Notification Bell & Real-Time Push Notifications

## Overview

Add an in-app notification center (bell icon with badge) to the navbar, and real-time push notifications starting with friend requests. When someone sends a friend request, the receiver gets a push notification and sees the unread count on the bell badge.

---

## Architecture Decision: How to Send Push Notifications

**Recommended: Supabase Database Webhook + Edge Function**

The flow:
1. User A sends a friend request (inserts into `friend_requests` table)
2. A **database webhook** fires on INSERT to `friend_requests`
3. The webhook calls a **Supabase Edge Function** (`send-push-notification`)
4. The Edge Function looks up the receiver's Expo push tokens from `user_push_mobile_subscriptions`
5. The Edge Function calls the **Expo Push API** (`https://exp.host/--/api/v2/push/send`)
6. The Edge Function inserts a row into a new `notifications` table for in-app history

**Why this approach:**
- No polling needed — notifications are triggered server-side at the moment of insert
- Edge Functions can securely access the database with the service role key
- Works even when the app is closed/backgrounded (push notification)
- The `notifications` table gives us in-app history for the bell dropdown
- Easy to extend to other notification types later (friend accepted, etc.)

**Alternative considered: Supabase Realtime (client-side channel subscription)**
- Only works when the app is open and connected
- Would still need a separate push mechanism for background notifications
- Better suited for live updates (like chat), not one-off notifications

---

## Phase 1: Database — `notifications` Table

### Migration: `YYYYMMDDHHmmss_add_notifications_table.sql`

```sql
-- Notifications table for in-app notification history
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,            -- 'friend_request', 'friend_accepted', etc.
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',       -- payload: { senderId, senderName, requestId }
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role needs INSERT access (edge function uses service role)
-- No INSERT policy needed since edge function bypasses RLS with service_role key
```

---

## Phase 2: Supabase Edge Function — `send-push-notification`

### File: `supabase/functions/send-push-notification/index.ts`

This edge function is called by the database webhook when a new friend request is inserted.

```
Responsibilities:
1. Receive the webhook payload (INSERT record from friend_requests)
2. Look up the sender's display_name from users table
3. Look up receiver's active push tokens from user_push_mobile_subscriptions
4. Insert a notification row into the notifications table
5. Send Expo push notification to all receiver's devices
```

**Webhook payload shape** (Supabase sends this automatically):
```json
{
  "type": "INSERT",
  "table": "friend_requests",
  "record": {
    "id": "...",
    "sender_id": "...",
    "receiver_id": "...",
    "status": "pending",
    "created_at": "..."
  }
}
```

**Edge Function logic:**
- Use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for reading tokens and inserting notifications
- Call Expo Push API: `POST https://exp.host/--/api/v2/push/send`
- Expo push message format:
  ```json
  {
    "to": "ExponentPushToken[xxx]",
    "title": "New Friend Request",
    "body": "{senderName} sent you a friend request",
    "data": { "type": "friend_request", "senderId": "..." },
    "channelId": "social"
  }
  ```
- Handle multiple devices (user may have multiple tokens)
- Ignore inactive tokens (`is_active = false`)

**Environment variables needed in Supabase Dashboard:**
- `SUPABASE_URL` (auto-available in edge functions)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-available in edge functions)

---

## Phase 3: Database Webhook Setup

Set up via **Supabase Dashboard** (Database > Webhooks), or via migration:

```sql
-- Alternative: set up webhook via pg_net extension if available
-- Otherwise, configure in Supabase Dashboard:
--   Table: friend_requests
--   Events: INSERT
--   Type: Supabase Edge Function
--   Function: send-push-notification
```

**Dashboard steps:**
1. Go to Supabase Dashboard > Database > Webhooks
2. Create new webhook:
   - Name: `on_friend_request_created`
   - Table: `friend_requests`
   - Events: `INSERT`
   - Type: Supabase Edge Function
   - Function: `send-push-notification`
   - Additional headers: Add auth header with service role key if needed

---

## Phase 4: Mobile — Notification Channel

### File: `mobile/features/push-notifications/actions.ts`

Add a new notification channel for social notifications:

```typescript
// Add to configureNotificationChannels()
Notifications.setNotificationChannelAsync("social", {
  name: "Social",
  importance: Notifications.AndroidImportance.HIGH,
  sound: "default",
});
```

---

## Phase 5: Mobile — Database Functions

### File: `mobile/database/notifications/get-notifications.ts`

```
- Fetch notifications for the current user
- Order by created_at DESC
- Limit to reasonable amount (e.g., 50)
- Return typed Notification[]
```

### File: `mobile/database/notifications/get-unread-count.ts`

```
- SELECT count(*) FROM notifications WHERE user_id = current AND is_read = false
- Used for the badge number
```

### File: `mobile/database/notifications/mark-as-read.ts`

```
- UPDATE notifications SET is_read = true WHERE id = ? AND user_id = current
```

### File: `mobile/database/notifications/mark-all-as-read.ts`

```
- UPDATE notifications SET is_read = true WHERE user_id = current AND is_read = false
```

---

## Phase 6: Mobile — Types

### File: `mobile/types/models.ts`

Add Notification type:

```typescript
export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};
```

---

## Phase 7: Mobile — React Query Hooks

### File: `mobile/features/notifications/hooks/useNotifications.ts`

```
- useQuery for fetching notifications list
- queryKey: ["notifications"]
- Refetch on app focus
```

### File: `mobile/features/notifications/hooks/useUnreadCount.ts`

```
- useQuery for unread count
- queryKey: ["notifications", "unread-count"]
- Short staleTime for freshness
- This drives the badge number
```

### File: `mobile/features/notifications/hooks/useMarkAsRead.ts`

```
- useMutation for marking single notification as read
- Invalidates ["notifications"] and ["notifications", "unread-count"]
```

### File: `mobile/features/notifications/hooks/useMarkAllAsRead.ts`

```
- useMutation for marking all as read
- Invalidates same query keys
```

---

## Phase 8: Mobile — Real-Time Unread Count via Supabase Realtime

To keep the badge count fresh without constant polling, subscribe to the `notifications` table using Supabase Realtime:

### File: `mobile/features/notifications/hooks/useNotificationSubscription.ts`

```
- Subscribe to INSERT events on notifications table filtered by user_id
- On new notification received:
  - Invalidate ["notifications", "unread-count"] query
  - Invalidate ["notifications"] query
  - Invalidate ["friend-requests"] query (so the friends page updates too)
- Clean up subscription on unmount
- Place in _layout.tsx or LayoutWrapper so it's always active when logged in
```

This gives us **instant badge updates** when a new notification arrives while the app is open, complementing the push notification for when it's closed.

---

## Phase 9: Mobile — NotificationBell Component (Updated)

### File: `mobile/features/navbar/notificationBell.tsx`

Current state: Just a bell icon with no functionality.

Updated:
```
- Wrap with Link to /notifications page
- Use useUnreadCount hook to get badge number
- Show red badge circle with count when count > 0
- Badge: small red circle (w-5 h-5) positioned absolute at top-right of the bell
  - Shows number if <= 9, shows "9+" if more
  - White text, bg-red-500, rounded-full
- Bell icon stays the same (Bell from lucide-react-native)
```

**Visual:**
```
  [🔔]    ← bell icon (existing)
     (3)  ← red badge at top-right corner (new)
```

---

## Phase 10: Mobile — Notifications Page

### File: `mobile/app/notifications/index.tsx`

Full-page notification center:

```
- ModalPageWrapper
- Header: "Notifications" with "Mark all as read" button
- FlatList of notifications
- Each notification item:
  - Icon based on type (UserPlus for friend_request, etc.)
  - Title + body text
  - Time ago (e.g., "2 min ago")
  - Unread indicator (blue dot or slightly different background)
  - Pressable — marks as read on tap and navigates to relevant page
    - friend_request → /menu/friends
- Empty state: "No notifications yet"
- Pull-to-refresh
```

---

## Phase 11: Mobile — Handle Push Notification Taps

### File: `mobile/features/notifications/useNotificationNavigation.ts`

```
- Listen for notification responses (taps on push notifications)
- Read the data.type field from the notification
- Navigate accordingly:
  - "friend_request" → router.push("/menu/friends")
- Integrate into existing notification response handling in _layout.tsx
```

---

## Phase 12: Translations

### File: `mobile/locales/en/notifications.json`

```json
{
  "notifications": {
    "title": "Notifications",
    "markAllAsRead": "Mark all as read",
    "empty": "No notifications yet",
    "friendRequest": {
      "title": "New Friend Request",
      "body": "{{name}} sent you a friend request"
    },
    "friendAccepted": {
      "title": "Friend Request Accepted",
      "body": "{{name}} accepted your friend request"
    },
    "timeAgo": {
      "now": "Just now",
      "minutes": "{{count}} min ago",
      "hours": "{{count}}h ago",
      "days": "{{count}}d ago"
    }
  }
}
```

### File: `mobile/locales/fi/notifications.json`

```json
{
  "notifications": {
    "title": "Ilmoitukset",
    "markAllAsRead": "Merkitse kaikki luetuksi",
    "empty": "Ei ilmoituksia",
    "friendRequest": {
      "title": "Uusi kaveripyyntö",
      "body": "{{name}} lähetti sinulle kaveripyynnön"
    },
    "friendAccepted": {
      "title": "Kaveripyyntö hyväksytty",
      "body": "{{name}} hyväksyi kaveripyyntösi"
    },
    "timeAgo": {
      "now": "Juuri nyt",
      "minutes": "{{count}} min sitten",
      "hours": "{{count}} t sitten",
      "days": "{{count}} pv sitten"
    }
  }
}
```

---

## Phase 13: Extend — Friend Request Accepted Notification

Once the base system works, add a second notification type:

- Add another database webhook on `friend_requests` for **UPDATE** where `status = 'accepted'`
- Or handle both INSERT and UPDATE in the same edge function, checking the event type
- When accepted: notify the original sender that their request was accepted
- Same flow: edge function → notifications table → Expo push

---

## Implementation Order

1. **Migration** — Create `notifications` table
2. **Edge Function** — `send-push-notification` with friend request handler
3. **Database Webhook** — Wire INSERT on `friend_requests` to edge function
4. **Mobile types** — Add Notification type
5. **Mobile database functions** — get, count, mark read
6. **Mobile hooks** — useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead
7. **Mobile realtime subscription** — useNotificationSubscription
8. **Mobile notification channel** — Add "social" channel
9. **NotificationBell** — Update with badge and link
10. **Notifications page** — Full notification list UI
11. **Push tap handling** — Navigate on notification tap
12. **Translations** — EN + FI
13. **Test end-to-end** — Send friend request from another account, verify push + badge + page
14. **Extend** — Friend accepted notification

---

## Files to Create/Modify

### New Files
- `supabase/functions/send-push-notification/index.ts`
- `supabase/migrations/YYYYMMDDHHmmss_add_notifications_table.sql`
- `mobile/database/notifications/get-notifications.ts`
- `mobile/database/notifications/get-unread-count.ts`
- `mobile/database/notifications/mark-as-read.ts`
- `mobile/database/notifications/mark-all-as-read.ts`
- `mobile/features/notifications/hooks/useNotifications.ts`
- `mobile/features/notifications/hooks/useUnreadCount.ts`
- `mobile/features/notifications/hooks/useMarkAsRead.ts`
- `mobile/features/notifications/hooks/useMarkAllAsRead.ts`
- `mobile/features/notifications/hooks/useNotificationSubscription.ts`
- `mobile/features/notifications/useNotificationNavigation.ts`
- `mobile/app/notifications/index.tsx`
- `mobile/locales/en/notifications.json`
- `mobile/locales/fi/notifications.json`

### Modified Files
- `mobile/features/navbar/notificationBell.tsx` — Add badge + link
- `mobile/features/push-notifications/actions.ts` — Add "social" channel
- `mobile/types/models.ts` — Add Notification type
- `mobile/features/layout/LayoutWrapper.tsx` — Add realtime subscription
- `mobile/app/_layout.tsx` — Add notification tap handler
