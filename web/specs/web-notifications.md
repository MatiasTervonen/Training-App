# Web Notifications: Live In-App + Browser Push

## Overview

Port the mobile notification system to the web app. The entire backend (tables, RPC, edge function, Realtime publications) already exists — this spec covers the **web frontend** and the edge function/API changes needed to deliver web push.

Currently:
- `NotificationBell` only shows friend requests (doesn't use the `notifications` table)
- Web push subscription infrastructure exists (`sw.js`, `PushNotificationManager`, `web-push` npm) but the edge function only sends to mobile Expo tokens
- No in-app notification feed, no realtime updates, no unread badge

---

## Scope

### In v1

| Feature | Notes |
|---------|-------|
| In-app notification bell | Dropdown with full notification list, replaces current friend-request-only bell |
| Unread badge | Red circle on bell icon, "9+" if > 9 |
| Notification types | friend_request, friend_accepted, feed_like, feed_comment, feed_reply, chat_message |
| Time grouping | Today, Yesterday, This Week, Earlier |
| Mark as read | Single + mark all as read |
| Click navigation | Each notification type routes to the relevant page |
| Realtime updates | Supabase Realtime on `notifications` table INSERT |
| Browser push delivery | Edge function sends web push alongside Expo push |
| Service worker navigation | Click browser push notification → opens correct page |
| Translations | EN + FI, new `notifications` namespace |

### NOT in v1 (future)

- Notification preferences/settings (mute specific types)
- Sound effects on notification arrival
- Desktop notification grouping/stacking
- Notification page (full page, beyond dropdown)

---

## Design Decisions

### Edge function → Next.js API route for web push

The edge function (Deno) can't reliably use `web-push` npm (needs Node.js crypto). Instead, the edge function calls a Next.js API route (`/api/send-web-push`) that uses the existing `web-push` setup. Protected by a shared API secret.

### Realtime in navbar

The `useNotificationRealtime` hook runs in the navbar component, which renders on every authenticated page. No separate wrapper needed.

### Reuse CustomDropDown

The existing `NotificationBell` already uses `CustomDropDown` for the dropdown. Keep this pattern but expand the content.

---

## Existing Infrastructure

| What | Where |
|------|-------|
| `notifications` table | `supabase/migrations/20260302120000_add_notifications_table.sql` |
| Edge function (mobile only) | `supabase/functions/send-push-notification/index.ts` |
| Web push subscriptions table | `user_push_subscriptions` in schema migration |
| Web push subscribe/unsubscribe | `web/components/pushnotifications/actions.ts` |
| Service worker | `web/public/sw.js` |
| `web-push` npm setup | `web/components/pushnotifications/actions.ts` (VAPID configured) |
| Push subscription DB functions | `web/database/push-notifications/` (save, delete, get-all-active) |
| Current NotificationBell | `web/components/navbar/NotificationBell.tsx` (friend requests only) |
| CustomDropDown | `web/components/customDropDown.tsx` |
| Mobile notification hooks | `mobile/features/notifications/hooks/` (pattern to follow) |
| Mobile notification DB | `mobile/database/notifications/` (pattern to follow) |
| Mobile utilities | `mobile/features/notifications/utils/timeAgo.ts`, `groupByTimePeriod.ts` |
| Mobile notification type | `mobile/types/models.ts:102` |
| Realtime pattern (web) | `web/features/chat/hooks/useChatRealtime.ts` |
| User ID hook (web) | `web/features/chat/hooks/useCurrentUserId.ts` |
| Error handler | `web/utils/handleError.ts` |
| Supabase client | `web/utils/supabase/client.ts` (browser), `web/utils/supabase/admin.ts` (service role) |

---

## Implementation

### Part 1: Notification Type + Database Functions

**New file: `web/types/notification.ts`**
```ts
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

**New files in `web/database/notifications/`:**
- `get-notifications.ts` — fetch up to 50 notifications, ordered by `created_at` DESC
- `get-unread-count.ts` — `select("*", { count: "exact", head: true })` where `is_read=false`
- `mark-as-read.ts` — update single notification by id
- `mark-all-as-read.ts` — update all where `is_read=false`

All use `createClient` from `@/utils/supabase/client`, `getClaims()` for auth (never `getSession()`), `handleError` from `@/utils/handleError`.

---

### Part 2: React Query Hooks

**New files in `web/features/notifications/hooks/`:**

| Hook | Query Key | Stale Time | Type |
|------|-----------|------------|------|
| `useNotifications` | `["notifications"]` | 0 | query |
| `useUnreadCount` | `["notifications", "unread-count"]` | 30s | query |
| `useMarkAsRead` | invalidates both | — | mutation |
| `useMarkAllAsRead` | invalidates both | — | mutation |
| `useNotificationRealtime` | — | — | realtime subscription |

`useNotificationRealtime`:
- Uses `useCurrentUserId()` from `@/features/chat/hooks/useCurrentUserId`
- Subscribes to `postgres_changes` INSERT on `notifications` table filtered by `user_id`
- Invalidates: `["notifications"]`, `["notifications", "unread-count"]`, `["get-FriendRequest"]`, `["social-feed"]`

---

### Part 3: Notification Utilities

**New files in `web/features/notifications/utils/`:**
- `timeAgo.ts` — port from mobile, uses `notifications:notifications.timeAgo.*` translations
- `groupByTimePeriod.ts` — port from mobile, uses `notifications:notifications.sections.*` translations

---

### Part 4: Rewrite NotificationBell

**Modify: `web/components/navbar/NotificationBell.tsx`**

Replace entirely. New component:
- Uses `useUnreadCount`, `useNotifications`, `useMarkAsRead`, `useMarkAllAsRead` hooks
- `CustomDropDown` with bell icon button (keep existing bell styling)
- Unread badge: red circle, absolute positioned, shows count or "9+"
- Dropdown content (w-96):
  - Title: "Notifications" + bell icon (centered)
  - "Mark all as read" button (shown when unread > 0)
  - Grouped notification list (using `groupByTimePeriod`)
  - Each section: header label (Today, Yesterday, etc.)
  - Each notification item: time ago, icon by type, body text, unread dot
  - Empty state: "No notifications yet"

**Icons per notification type:**
| Type | Icon | Color |
|------|------|-------|
| `friend_request` | `UserPlus` | `text-blue-500` |
| `friend_accepted` | `UserCheck` | `text-green-500` |
| `feed_like` | `Heart` | `text-red-500` |
| `feed_comment` | `MessageCircle` | `text-blue-500` |
| `feed_reply` | `Reply` | `text-purple-500` |
| `chat_message` | `Send` | `text-cyan-400` |
| default | `BellRing` | `text-gray-400` |

**Navigation on click:**
| Type | Route |
|------|-------|
| `friend_request`, `friend_accepted` | `/menu/friends` |
| `feed_like` | `/dashboard?feedMode=friends&feedItemId={data.feedItemId}` |
| `feed_comment`, `feed_reply` | `/dashboard?feedMode=friends&feedItemId={data.feedItemId}&openComments=true` |
| `chat_message` | `/chat?conversationId={data.conversationId}` |

---

### Part 5: Realtime Subscription

**Modify: `web/components/navbar/navbar.tsx`**

Add `useNotificationRealtime()` call inside the `Navbar` component. The navbar renders on all authenticated pages, so this ensures realtime is always active.

---

### Part 6: Translations

**New files:**
- `web/app/lib/i18n/locales/en/notifications.json` — copy from `mobile/locales/en/notifications.json`
- `web/app/lib/i18n/locales/fi/notifications.json` — copy from `mobile/locales/fi/notifications.json`

**Modify:**
- `web/app/lib/i18n/locales/en/index.ts` — add `export { default as notifications } from "./notifications.json";`
- `web/app/lib/i18n/locales/fi/index.ts` — same export

---

### Part 7: Edge Function — Web Push Delivery

**New file: `web/app/api/send-web-push/route.ts`**
- POST endpoint
- Validates `x-api-secret` header against `WEB_PUSH_API_SECRET` env var
- Body: `{ userId: string, title: string, body: string, data: Record<string, string> }`
- Uses admin Supabase client to query `user_push_subscriptions` for `userId` where `is_active=true`
- Uses `web-push` (already installed, VAPID already configured in `actions.ts`) to send to each subscription
- On 410/404: delete stale subscription from DB
- Returns `{ success: true }` or error

**Modify: `supabase/functions/send-push-notification/index.ts`**
- Add helper `sendWebPushNotifications(userId, title, body, data)`:
  - POST to `${WEB_APP_URL}/api/send-web-push` with `x-api-secret` header
  - Fire-and-forget (don't block Expo push on web push failure)
- Call this helper in each notification handler after the Expo push section
- New env vars needed: `WEB_APP_URL`, `WEB_PUSH_API_SECRET`

---

### Part 8: Enhance Service Worker

**Modify: `web/public/sw.js`**

```js
// Push event — parse data for navigation
self.addEventListener("push", function (event) {
  if (event.data) {
    const payload = event.data.json();
    const data = payload.notification || payload;
    const options = {
      body: data.body,
      icon: data.icon || "/icon.png",
      badge: "/small-notification-icon.png",
      vibrate: [200, 100, 200, 100, 400],
      requireInteraction: true,
      tag: data.data?.tag || undefined,          // collapse same-type notifications
      data: data.data || {},                      // pass through for click handler
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Click event — navigate based on notification type
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  let url = self.location.origin;

  switch (data.type) {
    case "friend_request":
    case "friend_accepted":
      url += "/menu/friends";
      break;
    case "feed_like":
      url += `/dashboard?feedMode=friends&feedItemId=${data.feedItemId}`;
      break;
    case "feed_comment":
    case "feed_reply":
      url += `/dashboard?feedMode=friends&feedItemId=${data.feedItemId}&openComments=true`;
      break;
    case "chat_message":
      url += `/chat?conversationId=${data.conversationId}`;
      break;
  }

  event.waitUntil(clients.openWindow(url));
});
```

---

## Files Summary

| Action | File |
|--------|------|
| **New** | `web/types/notification.ts` |
| **New** | `web/database/notifications/get-notifications.ts` |
| **New** | `web/database/notifications/get-unread-count.ts` |
| **New** | `web/database/notifications/mark-as-read.ts` |
| **New** | `web/database/notifications/mark-all-as-read.ts` |
| **New** | `web/features/notifications/hooks/useNotifications.ts` |
| **New** | `web/features/notifications/hooks/useUnreadCount.ts` |
| **New** | `web/features/notifications/hooks/useMarkAsRead.ts` |
| **New** | `web/features/notifications/hooks/useMarkAllAsRead.ts` |
| **New** | `web/features/notifications/hooks/useNotificationRealtime.ts` |
| **New** | `web/features/notifications/utils/timeAgo.ts` |
| **New** | `web/features/notifications/utils/groupByTimePeriod.ts` |
| **New** | `web/app/lib/i18n/locales/en/notifications.json` |
| **New** | `web/app/lib/i18n/locales/fi/notifications.json` |
| **New** | `web/app/api/send-web-push/route.ts` |
| **Modify** | `web/components/navbar/NotificationBell.tsx` |
| **Modify** | `web/components/navbar/navbar.tsx` |
| **Modify** | `web/public/sw.js` |
| **Modify** | `supabase/functions/send-push-notification/index.ts` |
| **Modify** | `web/app/lib/i18n/locales/en/index.ts` |
| **Modify** | `web/app/lib/i18n/locales/fi/index.ts` |

---

## Env Vars Needed

| Var | Where | Purpose |
|-----|-------|---------|
| `WEB_APP_URL` | Supabase Edge Function secrets | Base URL of Next.js app (e.g., `https://your-app.vercel.app`) |
| `WEB_PUSH_API_SECRET` | Supabase Edge Function secrets + Next.js `.env` | Shared secret to protect the web push API route |

---

## Verification

1. **In-app notifications:** Open web app → have another user send a friend request / like a post / send a chat message → notification bell should show unread badge in realtime → click notification → navigates to correct page → notification marked as read
2. **Browser push:** Enable push notifications in settings → close/background the tab → trigger a notification → browser push should appear → click it → opens correct page
3. **Edge function:** Check Supabase function logs after triggering events to verify both Expo and web push calls succeed
4. **Translations:** Switch language to Finnish → notification bell text should be in Finnish
