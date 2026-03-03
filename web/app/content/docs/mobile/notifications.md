# Notifications

The app uses a combined **push notification + in-app notification** system. Features trigger notifications through Supabase Edge Functions, which both send push notifications via Expo and store them in the database for in-app display.

## Architecture

1. A feature action occurs (e.g. friend request INSERT)
2. Supabase Database Webhook fires
3. Edge Function (`send-push-notification`) runs and does two things:
   - Inserts a row into the `notifications` table (in-app history)
   - Sends a push notification via the Expo Push API
4. Realtime subscription picks up the INSERT and invalidates React Query cache
5. UI updates automatically (badge count, notification list)

## Database

**Table: `notifications`**

- **`id`** (uuid) — Primary key
- **`user_id`** (uuid) — References `users(id)`
- **`type`** (text) — Notification type (e.g. `friend_request`, `friend_accepted`)
- **`title`** (text) — Display title
- **`body`** (text) — Display body text
- **`data`** (jsonb) — Arbitrary payload (sender ID, request ID, etc.)
- **`is_read`** (boolean) — Read status, defaults to `false`
- **`created_at`** (timestamptz) — Creation timestamp

**Indexes:**
- `idx_notifications_user_id` — Fast lookup by user
- `idx_notifications_user_unread` — Partial index on `is_read = false` for unread count queries

**RLS:** Users can only SELECT and UPDATE their own notifications. Realtime is enabled on the table for live updates.

## Edge Function

**`supabase/functions/send-push-notification/index.ts`**

A single edge function that handles all notification types. It receives database webhook payloads and:

1. Looks up context (e.g. sender's display name)
2. Queries `user_push_mobile_subscriptions` for the receiver's active Expo push tokens
3. Inserts a row into the `notifications` table
4. Sends the push notification via the Expo Push API (`https://exp.host/--/api/v2/push/send`)

Push payload includes:
- `title` and `body` — Displayed in the system notification
- `data` — Type and metadata for navigation on tap
- `channelId` — Android notification channel (e.g. `social`)
- `sound` — `default`

### Adding a New Notification Type

To add notifications for a new feature:

1. **Add a handler function** inside the existing `send-push-notification/index.ts` (like `handleFriendRequest` and `handleFriendAccepted`)
2. **Add a webhook** in Supabase Dashboard if the trigger comes from a new table. Each webhook watches one table, so if the table already has a webhook (e.g. `friend_requests`), you just add logic in the edge function — no new webhook needed.
3. **Add navigation** in `useNotificationNavigation.ts` so tapping the push notification routes to the correct screen
4. **Add translations** in `locales/en/notifications.json` and `locales/fi/notifications.json`
5. **Add an icon** in `NotificationBell.tsx` for the new type

No changes needed to the notification infrastructure itself — the bell, hooks, and realtime subscription handle all types automatically.

## Key Files

**Database Functions** (`database/notifications/`)
- `get-notifications.ts` — Fetch all notifications for current user (limit 50, newest first)
- `get-unread-count.ts` — Count of unread notifications
- `mark-as-read.ts` — Mark a single notification as read
- `mark-all-as-read.ts` — Mark all notifications as read

**React Query Hooks** (`features/notifications/hooks/`)
- `useNotifications.ts` — Query for the notification list (`staleTime: 0`)
- `useUnreadCount.ts` — Query for unread badge count (`staleTime: 30s`)
- `useMarkAsRead.ts` — Mutation, invalidates both queries
- `useMarkAllAsRead.ts` — Mutation, invalidates both queries
- `useNotificationSubscription.ts` — Supabase Realtime subscription on INSERT events, invalidates queries on new notifications

**UI** (`features/navbar/notificationBell.tsx`)
- Bell icon with red badge showing unread count (max `9+`)
- Modal dropdown with notification list, mark-all-as-read button, and empty state
- Each item shows an icon by type, relative time, and an unread dot indicator
- Tapping a notification marks it as read and navigates to the relevant screen

**Push Tap Handler** (`features/notifications/useNotificationNavigation.ts`)
- Listens for `Notifications.addNotificationResponseReceivedListener`
- Reads `data.type` from the push payload and navigates accordingly

## Realtime

The `useNotificationSubscription` hook subscribes to Postgres changes on the `notifications` table, filtered by the current user's ID. It runs in `_layout.tsx` so it's always active when logged in.

On receiving an INSERT event, it invalidates:
- `["notifications", "unread-count"]` — Updates the badge
- `["notifications"]` — Refreshes the notification list
- Related queries (e.g. `["friend-requests"]`) so the UI stays in sync

## Push Token Registration

Push tokens are stored in the `user_push_mobile_subscriptions` table. The app registers the device's Expo push token on login and updates it when the token changes. The edge function queries this table to find all active tokens for the target user.
