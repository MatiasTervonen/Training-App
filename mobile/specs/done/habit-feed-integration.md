# Habit Feed Integration (Phase 2)

Adds habit tracking summary to the daily feed. One feed item per day, updated on each habit toggle.

## Feed Card Behavior

### Collapsed Card (BaseFeedCard)
- Completion count: "3/4 completed"
- Green checkmark when all habits are done
- Current streak info
- Standard footer with type icon, date, and "Details" button

### No Expanded View
- "Details" button navigates to `/habits` page instead of opening an expanded card
- The habits page already has calendar, checklist, and full functionality — no need to duplicate

## How Feed Items Are Generated

No cron job needed. Same pattern as todos:
- Every time a habit is toggled, upsert a `habits` feed item for today
- The `habit_toggle_log` RPC gets extended (or a wrapper RPC) to:
  1. Toggle the habit log (existing behavior)
  2. Count today's completed/total habits
  3. Upsert into `feed_items` where `type = 'habits'` and `occurred_at = today`
  4. Update `extra_fields` with completion and streak data

One feed item per day, updated on each toggle.

### extra_fields Schema
```json
{
  "completed": 3,
  "total": 4,
  "current_streak": 14
}
```

## Implementation Steps

| Step | What | Files |
|------|------|-------|
| 1 | New migration: update `habit_toggle_log` RPC to also upsert `feed_items` | `supabase/migrations/` |
| 2 | Add `"habits"` to feed item types | `types/session.ts`, `types/database.types.ts` |
| 3 | Create `HabitSummaryCard` component (collapsed only) | `features/habits/cards/habit-feed.tsx` |
| 4 | Add case to `FeedCard.tsx` router | `features/feed-cards/FeedCard.tsx` |
| 5 | Handle "Details" -> navigate to `/habits` | In the card component |
| 6 | Invalidate feed query on habit toggle | `features/habits/hooks/useToggleHabit` |
| 7 | Add translations | `locales/en/habits.json`, `locales/fi/habits.json` |
| 8 | Delete feed item handling | `database/feed/deleteSession.ts` |
