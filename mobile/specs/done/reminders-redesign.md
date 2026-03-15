# Reminders Redesign

## Overview

Redesign the reminders section to match the notes and todo pattern: the landing page (`/reminders`) becomes the reminders feed with a floating `+` button, and all 4 reminder types are created from a single unified page.

---

## Current State

- `/reminders/index.tsx` — menu page with LinkButtons to 4 creation pages + my-reminders
- `/reminders/my-reminders/index.tsx` — list of reminders with tabs (normal/repeating/delivered), uses ScrollView + PageContainer, custom `ReminderByTab` type, no pinning
- 4 separate creation pages: `global-reminder/`, `onetime-reminder/`, `weekly-reminder/`, `daily-reminder/`
- Reminder feed cards already exist in the feed system: `GlobalReminderCard-feed.tsx`, `LocalReminderCard-feed.tsx`
- `FeedCard.tsx` already routes `global_reminders` and `local_reminders` types

---

## Design Decisions

### Landing page pattern

Match notes and todo exactly:
- `LinearGradient` background (not `PageContainer`)
- Filter tabs at the top (same style as todo: `bg-slate-800` wrapper, `text-cyan-400` active)
- `FlatList` with `FeedCard` components (not custom `MyReminderCard`)
- Pinned items via `FeedHeader` carousel
- Infinite scroll pagination
- Pull-to-refresh
- Floating `+` button → navigates to `/reminders/create-reminder`
- Push-disabled modal from current landing page is preserved

### Feed data source

Use `feed_items` table filtered by type (same as notes/todo), not the `reminders_get_by_tab` RPC. This lets us reuse all existing feed infrastructure:
- `FeedCard` with `BaseFeedCard` (pin/edit/delete/expand menu)
- `FeedHeader` for pinned carousel
- `FeedFooter` for pagination
- `useTogglePin` for pinning
- `useDeleteSession` for deletion (already handles reminder notification cancellation)

### Tab filtering

Two tabs, simple and clear:
- **Upcoming**: All reminders that haven't fired yet — one-time reminders waiting to fire + all active repeating (daily/weekly)
- **Delivered**: All reminders that have already fired — `extra_fields->delivered = true` OR `extra_fields->seen_at` is not null

This needs a new RPC (`reminders_get_feed`) that returns `feed_items` rows filtered by tab, with pinned support — same pattern as `notes_get_by_folder`.

### Unified create page

Replace the 4 separate creation pages with one page at `/reminders/create-reminder`. The page has a type selector at the top that controls which form fields appear.

### What to do with old pages

- `/reminders/my-reminders/` — delete (content moves to `/reminders/index.tsx`)
- `/reminders/global-reminder/` — keep for now (can be removed after unified create page is built)
- `/reminders/onetime-reminder/` — keep for now
- `/reminders/weekly-reminder/` — keep for now
- `/reminders/daily-reminder/` — keep for now

---

## Part 1: Reminders Feed Landing Page

### New file: `database/reminders/get-reminders-feed.ts`

Follow the `database/notes/get-notes.ts` pattern exactly:

```typescript
export type ReminderFilter = "upcoming" | "delivered";

export function getPinnedContext(): string {
  return "reminders";
}

export async function getRemindersFeed({
  pageParam = 0,
  limit = 10,
  filter,
}: {
  pageParam?: number;
  limit?: number;
  filter: ReminderFilter;
}): Promise<{ feed: FeedItemUI[]; nextPage: number | null }>
```

- Fetches pinned items from `pinned_items` table (page 0 only) with `pinned_context = "reminders"`
- Fetches unpinned items via new RPC `reminders_get_feed` that filters `feed_items` by tab
- Deduplicates pinned from unpinned
- Returns `FeedItemUI[]` with `feed_context` set

### New file: `features/reminders/hooks/useMyRemindersFeed.ts`

Follow `features/notes/hooks/useMyNotesFeed.ts` pattern:

```typescript
export default function useMyRemindersFeed(filter: ReminderFilter) {
  // queryKey: ["myReminders"] or ["myReminders", filter]
  // useInfiniteQuery with getRemindersFeed
  // Cache cleanup on unmount (keep first page only)
  // Split pinnedFeed / unpinnedFeed
  // Return: data, error, isLoading, mutateFeed, fetchNextPage, hasNextPage,
  //         isFetchingNextPage, pinnedFeed, unpinnedFeed, queryKey, pinnedContext
}
```

### New RPC: `reminders_get_feed`

```sql
CREATE FUNCTION reminders_get_feed(
  p_tab TEXT,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS SETOF feed_items
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF p_tab = 'upcoming' THEN
    RETURN QUERY
      SELECT * FROM feed_items
      WHERE user_id = auth.uid()
        AND hidden_at IS NULL
        AND type IN ('global_reminders', 'local_reminders')
        AND (extra_fields->>'delivered')::boolean IS NOT TRUE
        AND extra_fields->>'seen_at' IS NULL
      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;

  ELSIF p_tab = 'delivered' THEN
    RETURN QUERY
      SELECT * FROM feed_items
      WHERE user_id = auth.uid()
        AND hidden_at IS NULL
        AND type IN ('global_reminders', 'local_reminders')
        AND (
          (extra_fields->>'delivered')::boolean = true
          OR extra_fields->>'seen_at' IS NOT NULL
        )
      ORDER BY activity_at DESC
      LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;
```

### Updated: `app/reminders/index.tsx`

Replace the current menu page with a feed page. Follow `app/todo/index.tsx` structure:

```
LinearGradient wrapper
  ├── Filter tabs (upcoming / delivered) — same style as todo
  ├── Loading: FeedSkeleton
  ├── Error: error message
  ├── Empty: "No reminders" message
  └── FlatList
       ├── ListHeaderComponent: FeedHeader (pinned carousel)
       ├── renderItem: FeedCard (reuse existing GlobalReminderCard-feed / LocalReminderCard-feed)
       ├── ListFooterComponent: FeedFooter
       ├── RefreshControl
       └── onEndReached: fetchNextPage
  ├── Floating + button → /reminders/create-reminder
  ├── FullScreenModal: expand (MyReminderSession)
  ├── FullScreenModal: edit global (EditMyGlobalReminder)
  ├── FullScreenModal: edit local (EditMyLocalReminder)
  └── Push-disabled Modal (from current landing page)
```

Key differences from notes/todo:
- Two edit modals (global vs local) based on `item.type`
- Push-disabled modal preserved from current landing page
- No `useFullSessions` needed (reminders don't have media attachments)

### Delete: `app/reminders/my-reminders/index.tsx`

This page is replaced by the new landing page. Delete the file and directory.

---

## Part 2: Unified Create Reminder Page

### New file: `app/reminders/create-reminder/index.tsx`

Single page with a type selector that controls the form.

#### Type selector

4 options displayed as selectable chips/buttons at the top:
- One-time (local, no weekdays, datetime picker)
- Daily (local, no weekdays, time picker)
- Weekly (local, with weekdays, time picker)
- Global (server-side, datetime picker)

Default selection: One-time

#### Shared form fields (all types)

- Title (`AppInput`)
- Notes (`SubNotesInput`)
- High priority toggle (`Toggle` with exact alarm permission handling)
- Save / Cancel buttons

#### Type-specific fields

| Field | One-time | Daily | Weekly | Global |
|-------|----------|-------|--------|--------|
| Date+time picker (`datetime`) | Yes | - | - | Yes |
| Time picker (`time`) | - | Yes | Yes | - |
| Weekday checkboxes | - | - | Yes | - |
| Global info banner | - | - | - | Yes |

#### Hooks

Reuse the existing save/notification hooks per type:
- `useSaveReminder` (global)
- `useSaveReminderOnetime` (one-time)
- `useSaveReminderDaily` (daily)
- `useSaveReminderWeekly` (weekly)

Call the appropriate hook based on selected type. Draft saving uses a single key `"create_reminder_draft"` that includes the selected type.

#### After save

- Invalidate `["myReminders"]` queries
- Navigate back to `/reminders`

---

## Translations

### English (`locales/en/reminders.json`)

```json
{
  "reminders.createReminder": "Create Reminder",
  "reminders.type.onetime": "One-time",
  "reminders.type.daily": "Daily",
  "reminders.type.weekly": "Weekly",
  "reminders.type.global": "Global",
  "reminders.tabs.upcoming": "Upcoming",
  "reminders.tabs.delivered": "Delivered",
  "reminders.noRemindersUpcoming": "No upcoming reminders",
  "reminders.noRemindersDelivered": "No delivered reminders",
  "reminders.selectType": "Select type"
}
```

### Finnish (`locales/fi/reminders.json`)

```json
{
  "reminders.createReminder": "Luo muistutus",
  "reminders.type.onetime": "Kertaluonteinen",
  "reminders.type.daily": "Päivittäinen",
  "reminders.type.weekly": "Viikoittainen",
  "reminders.type.global": "Globaali",
  "reminders.tabs.upcoming": "Tulevat",
  "reminders.tabs.delivered": "Toimitetut",
  "reminders.noRemindersUpcoming": "Ei tulevia muistutuksia",
  "reminders.noRemindersDelivered": "Ei toimitettuja muistutuksia",
  "reminders.selectType": "Valitse tyyppi"
}
```

---

## Implementation Order

1. **Database**: Create `reminders_get_feed` RPC migration
2. **Data layer**: Create `database/reminders/get-reminders-feed.ts`
3. **Hook**: Create `features/reminders/hooks/useMyRemindersFeed.ts`
4. **Landing page**: Rewrite `app/reminders/index.tsx` as feed page
5. **Delete**: Remove `app/reminders/my-reminders/`
6. **Create page**: Build `app/reminders/create-reminder/index.tsx`
7. **Cleanup**: Remove old creation pages once unified page works
8. **Translations**: Add new keys to EN/FI

---

## Scope

### In scope
- Feed-based landing page with FlatList, pinning, pagination, pull-to-refresh
- Reuse existing FeedCard/BaseFeedCard/FeedHeader/FeedFooter components
- Tab filtering (upcoming/delivered) via new RPC
- Floating `+` button → unified create page
- Unified create reminder page with type selector
- Push-disabled modal preserved
- Translations (EN/FI)

### Out of scope
- Changing the existing feed card designs (GlobalReminderCard-feed, LocalReminderCard-feed)
- Removing old individual creation pages (can be done as cleanup later)
- Adding media support to reminders
- Changes to the main session feed
