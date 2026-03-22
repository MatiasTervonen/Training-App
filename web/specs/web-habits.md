# Web Habits Feature

## Overview

Port the mobile habits feature to the web app. The backend (Supabase tables, RPCs) already exists — this is purely a frontend implementation in `web/`.

All three habit types exist in the database, but only **manual** and **duration** are fully interactive on web. **Steps** habits are displayed read-only (no pedometer on web).

---

## Design Decisions

### Scope: what to implement vs skip

| Feature | Web | Why |
|---------|-----|-----|
| Manual habits (checkbox toggle) | Full | No native dependencies |
| Duration habits (timer-based) | Full (simplified) | Reuse web timerStore, no native alarms |
| Steps habits | Read-only display | No pedometer in browser |
| CRUD (create/edit/delete/archive) | Full | Standard Supabase queries |
| Stats & streaks | Full | Same RPCs as mobile |
| Calendar month grid | Full | Better on big screen |
| Feed integration | Full | RPCs already generate feed items |
| Push notification reminders | Skip | Low value on web |
| Native alarms (priority alarm) | Skip | No equivalent in browser |
| Background tasks / headless JS | Skip | Not available in browser |
| Step counter / pedometer | Skip | Not available in browser |
| Notification-based completion | Skip | Not available in browser |

### Duration habits on web

- Use the existing web `timerStore` (Zustand) for countdown timer
- When timer reaches zero: play a sound or show browser notification (if permitted), auto-mark done
- No "priority alarm" option — only normal completion
- Still show alarm_type in the UI but as info-only if set from mobile
- Pause/resume works the same as mobile but state is in Zustand + localStorage instead of AsyncStorage

### Steps habits on web

- Show in the habit list with current progress (synced from mobile via `habit_logs`)
- Show as completed/incomplete based on `habit_logs` for the date
- No start/toggle interaction — just display
- Don't show steps type in the create form (can't create steps habits on web)

---

## Database Layer

### Existing RPCs to use

These already exist — just call them from the web frontend:

- `habit_toggle_log(p_habit_id, p_date, p_tz)` — toggle manual habit completion
- `habit_get_stats(p_habit_id, p_date)` — get streak/completion stats
- `refresh_habit_feed(p_date, p_tz)` — update feed item after changes

### Database query files to create (`web/database/habits/`)

- `get-habits.ts` — fetch all active habits for user, ordered by sort_order
- `save-habit.ts` — insert new habit (manual or duration only)
- `edit-habit.ts` — update habit properties
- `delete-habit.ts` — hard delete habit
- `archive-habit.ts` — soft delete (set is_active = false)
- `toggle-habit-log.ts` — call `habit_toggle_log` RPC
- `get-habit-logs.ts` — fetch habit_logs for date range
- `get-habit-stats.ts` — call `habit_get_stats` RPC
- `upsert-habit-progress.ts` — upsert accumulated_seconds for duration habits
- `mark-habit-done.ts` — mark habit as completed + refresh feed

Reference the mobile implementations at `mobile/database/habits/` for the exact queries and error handling patterns. Reference existing web database files (e.g., `web/database/activities/`) for the web-specific patterns (supabase client import, error handling).

---

## Types

### `web/types/habit.ts` (new file)

Copy from `mobile/types/habit.ts`:

```typescript
export type HabitType = "manual" | "steps" | "duration";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  target_value: number | null;
  frequency_days: number[] | null;
  reminder_time: string | null;
  alarm_type: "normal" | "priority";
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  completed_date: string;
  accumulated_seconds: number | null;
};

export type HabitStats = {
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  total_completions: number;
};
```

---

## Pages

### Follow the web app page pattern

Reference existing pages like `web/app/(app)/todo/page.tsx` or `web/app/(app)/activities/page.tsx` for the standard layout pattern: `"use client"`, translations, `page-padding max-w-md mx-auto`, `LinkButton` navigation.

### Pages to create (`web/app/(app)/habits/`)

#### 1. `page.tsx` — Landing page
- Links to: Today's habits, Create habit, My habits (list/manage)
- Standard landing page pattern with `LinkButton` components

#### 2. `today/page.tsx` — Today's habit checklist
- Show all habits scheduled for today (use `isHabitScheduledForDate` logic from mobile)
- Manual habits: checkbox toggle via `habit_toggle_log` RPC
- Duration habits: start/pause/resume timer + progress bar
- Steps habits: read-only progress display
- Show completion summary at top: "3/5 completed"
- Date selector to view other days

#### 3. `create/page.tsx` — Create new habit
- Type selector: Manual | Duration (no Steps option on web)
- Name input
- For duration: duration picker (hours + minutes) → stored as `target_value` in seconds
- Frequency: daily or specific days (day checkboxes, 1=Sun through 7=Sat)
- Alarm type selector (duration only): Normal | Priority
- Save button

#### 4. `edit/page.tsx` — Edit habit (with query param `?id=xxx`)
- Same form as create, pre-filled with existing values
- Type is NOT editable (same as mobile)
- Auto-save on change (debounced) or explicit save button — match web app pattern

#### 5. `[id]/page.tsx` — Habit detail/stats page
- Stats card: current streak, longest streak, completion rate, total completions
- Habit info: type, target, frequency, alarm type
- Actions: edit, archive, delete
- Calendar month grid showing completion history

#### 6. `[id]/history/page.tsx` — Full history
- Month-by-month calendar grids
- Infinite scroll through past months
- Same MonthGrid component as the main page but full-page

### Menu integration

Add a "Habits" link to the web menu page at `web/app/(app)/menu/page.tsx`.

---

## Components

### Create in `web/features/habits/components/`

#### `HabitChecklist.tsx`
- Renders list of habits for a given date
- Filters by `isHabitScheduledForDate`
- Maps to `HabitRow` components

#### `HabitRow.tsx`
- Single habit item
- Manual: name + toggle checkbox
- Duration: name + start/pause/resume button + progress bar + time display
- Steps: name + progress bar (read-only)
- Completed state: green check styling
- Click/link to detail page

#### `MonthGrid.tsx`
- Calendar grid for a single month
- Each day cell colored by completion status:
  - Green: all habits done
  - Yellow: some done
  - Gray: none done
  - Transparent: no habits scheduled
- Props: `year`, `month`, `habits`, `logs`

#### `StatsCard.tsx`
- Displays current streak, longest streak, completion rate, total completions
- Same layout as mobile but with web styling

#### `HabitForm.tsx`
- Reusable form for create/edit
- Type selector (manual/duration only)
- Name input, duration picker, frequency selector, alarm type
- Handles both create and edit modes

---

## Hooks

### Create in `web/features/habits/hooks/`

Reference mobile hooks at `mobile/features/habits/hooks/` and existing web hooks for patterns.

#### `useHabits.ts`
- React Query hook to fetch all active habits
- Query key: `["habits"]`

#### `useHabitLogs.ts`
- Fetch habit_logs for a date range
- Query key: `["habit-logs", startDate, endDate, habitId?]`

#### `useHabitStats.ts`
- Call `habit_get_stats` RPC for a single habit
- Query key: `["habit-stats", habitId]`

#### `useToggleHabit.ts`
- Mutation to call `habit_toggle_log` RPC
- Invalidates: `["habit-logs"]`, `["habit-stats"]`, `["feed"]`

#### `useSaveHabit.ts`
- Mutation to create a new habit
- Invalidates: `["habits"]`

#### `useEditHabit.ts`
- Mutation to update habit properties
- Invalidates: `["habits"]`

#### `useDeleteHabit.ts`
- Mutation to delete a habit
- Invalidates: `["habits"]`, `["feed"]`

#### `useArchiveHabit.ts`
- Mutation to archive (soft delete) a habit
- Invalidates: `["habits"]`, `["feed"]`

#### `useHabitTimer.ts` (duration habits only)
- Integrates with web `timerStore` (at `web/lib/stores/timerStore.ts`)
- `startHabitTimer(habit, accumulatedSeconds)` — calculate remaining, start countdown
- `pauseHabitTimer()` — save progress to DB via `upsertHabitProgress`
- `cancelHabitTimer()` — save progress, clear timer
- On completion: call `markHabitDone`, invalidate queries
- Store habit context in localStorage (equivalent of AsyncStorage on mobile)
- Expose: `activeHabitId`, `habitTimerState`

---

## Feed Integration

### Feed card (`web/features/habits/cards/`)

#### `habit-expanded.tsx`
- Expanded view shown in feed modal
- Shows: completed count, total scheduled, current streak
- Same data as mobile's `habit-feed.tsx`

#### `habit-edit.tsx`
- Edit view in feed (if applicable — may just link to habits page)

### Update `web/features/dashboard/components/sessionFeed.tsx`
- Import habit feed components
- Add habit case to the feed item type switch
- Handle habit feed item display

---

## Translations

### Create `web/app/lib/i18n/locales/en/habits.json`
### Create `web/app/lib/i18n/locales/fi/habits.json`

Port translations from mobile (`mobile/locales/en/habits.json` and `mobile/locales/fi/habits.json`), excluding steps-specific and native-alarm-specific keys that don't apply to web.

Add the namespace to the i18n config if needed.

---

## Utilities

### `web/features/habits/utils/isHabitScheduled.ts`

Port from mobile (`mobile/features/habits/utils/isHabitScheduled.ts`):
- `isHabitScheduledForDate(habit, dateStr)` — checks frequency_days + creation date
- `countScheduledHabits(habits, dateStr)` — count for a date

---

## Implementation Order

1. **Types** — `web/types/habit.ts`
2. **Database layer** — all files in `web/database/habits/`
3. **Utilities** — `isHabitScheduled.ts`
4. **Hooks** — all query/mutation hooks (except timer)
5. **Translations** — EN + FI
6. **Components** — HabitRow, HabitChecklist, MonthGrid, StatsCard, HabitForm
7. **Pages** — landing, today, create, edit, detail, history
8. **Feed integration** — feed cards + sessionFeed update
9. **Menu link** — add to menu page
10. **Duration timer** — useHabitTimer hook + timer integration
11. **Polish** — review, test, fix edge cases
