# Hide from Feed

## Overview

Add a quick "Hide" action to feed cards that removes them from the main feed without deleting them. Hidden items remain fully accessible in their feature-specific sections (gym history, notes list, todo list, etc.). This lets users declutter their main feed while keeping all data intact.

---

## Design Decisions

### Where does the "Hide" action live?

In the existing card long-press/context menu, alongside pin, edit, and delete. No new UI patterns needed — it's just another menu option.

### Confirmation dialog?

No. Hiding is non-destructive, so a confirmation dialog adds unnecessary friction. Instead, show a **toast** after hiding: "Hidden from feed" (translated). This confirms the action happened without interrupting flow.

### Can users unhide / add back to feed?

No. Hiding is one-way from the feed's perspective. The item is still fully accessible in its feature section (gym history, notes, todos, weight history, etc.). This keeps the feature simple — no need for a "hidden items" management screen or an "unhide" action in sub-feeds.

If a user hides something by accident, the cost is low — the data isn't deleted, just not shown in the main feed.

### Which feed item types support hiding?

All of them — the hide action works on any card type in the main feed.

| Type | Hideable | Still accessible in |
|------|----------|-------------------|
| `gym_sessions` | Yes | Gym history |
| `activity_sessions` | Yes | Activity history |
| `notes` | Yes | Notes list |
| `todo_lists` | Yes | Todo list |
| `weight` | Yes | Weight history |
| `habits` | Yes | Habits page |
| `reports` | Yes | Reports page |
| `global_reminders` | Yes | Reminders list |
| `local_reminders` | Yes | Reminders list |

### Can pinned items be hidden?

No. If a card is pinned, the user must unpin it first before hiding. Pinned items are intentionally kept visible — hiding a pinned item is contradictory. The "Hide" option should not appear in the menu for pinned cards.

---

## Database Schema

### 1. Add `hidden_at` column to `feed_items`

```sql
ALTER TABLE feed_items ADD COLUMN hidden_at TIMESTAMPTZ DEFAULT NULL;
```

- `NULL` = visible in feed (default, all existing items)
- Timestamp = hidden from feed at that time

### 2. Update `get_feed_sorted` RPC

Add a filter to exclude hidden items:

```sql
WHERE hidden_at IS NULL
```

Feature-specific sub-feeds (gym history, notes list, etc.) also query `feed_items` but filtered by type (e.g., `.eq("type", "gym_sessions")`). These queries must **not** filter by `hidden_at` — hidden items should still appear in their feature sections. Only the main feed RPC (`get_feed_sorted`) filters out hidden items.

---

## Client Implementation

### 1. Add "Hide" to feed card menu

Add a "Hide" option to the card context menu (where pin/edit/delete already are). Only show it for unpinned cards (`feed_context === "feed"`).

### 2. Database function

Create a simple function to set `hidden_at`:

```sql
CREATE OR REPLACE FUNCTION hide_feed_item(p_feed_item_id UUID)
RETURNS VOID AS $$
  UPDATE feed_items
  SET hidden_at = NOW()
  WHERE id = p_feed_item_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY INVOKER;
```

### 3. Client hook: `useHideFeedItem`

- Optimistically remove the item from the feed cache (same pattern as `useDeleteSession`)
- Call the `hide_feed_item` RPC
- Show a toast: "Hidden from feed"
- On error: roll back the optimistic update, show error toast

### 4. Optimistic cache update

Remove the hidden item from the feed query cache immediately (same pattern used by delete). No need to invalidate — just filter it out of the pages.

---

## UI Flow

1. User long-presses or opens menu on a feed card
2. Menu shows: Pin | Edit | **Hide** | Delete
3. User taps "Hide"
4. Card is immediately removed from feed (optimistic)
5. Toast appears: "Hidden from feed"
6. Background: `hidden_at` is set on the database

---

## Translations

### English (`locales/en/feed.json`)
```json
{
  "feed.hide": "Hide from feed",
  "feed.hide.success": "Hidden from feed"
}
```

### Finnish (`locales/fi/feed.json`)
```json
{
  "feed.hide": "Piilota syötteestä",
  "feed.hide.success": "Piilotettu syötteestä"
}
```

---

## Scope

### In scope
- "Hide" menu option on unpinned feed cards
- `hidden_at` column on `feed_items`
- Filter hidden items from `get_feed_sorted` RPC
- Optimistic cache removal + toast
- Translations (EN/FI)

### Out of scope
- "Unhide" / restore to feed
- Hidden items management screen
- Bulk hide
- Swipe-to-hide gesture
