# Habit Tracker — Feature Spec

## Context

Users want to track recurring daily habits like taking creatine, drinking water, stretching, etc. The feature provides a day-first habit tracker with a monthly calendar grid showing completion history, streak stats, and smart reminders that only fire if the habit hasn't been marked done yet.

---

## Requirements

- Create, edit, and delete habits (name, optional reminder time)
- Daily checklist: see today's habits and check them off
- Monthly calendar grid: color-coded days (all done / partial / none)
- Tap a day on the calendar to see/edit that day's checklist
- Per-habit detail view with individual streak history
- Stats: current streak, longest streak, completion rate
- Full history: vertically scrollable list of month grids
- Smart reminders: local notification at set time, auto-cancelled when habit is marked done
- Notification action button: "Mark as done" directly from notification (single-habit reminders only)
- Feed integration: daily habit summary card in the main feed

---

## How It Works

### Day-First Main Screen (`/habits`)

```
┌─ Habits ────────────────────────┐
│                                 │
│  Today's Habits                 │
│  ☑ Creatine                     │
│  ☑ Vitamins                     │
│  ☐ Stretch                      │
│                                 │
│  ← March 2026 →                 │
│  Mo Tu We Th Fr Sa Su           │
│   2  3  4  5  ●  ●  ◐          │
│   ●  ●  ◐  ●  ●  ●  ●         │
│   ●  ●  ○  ○  ●                │
│                                 │
│  [+ Add Habit]                  │
└─────────────────────────────────┘

● = all habits done   ◐ = partial   ○ = none done   (empty = future/no habits)
```

- Tapping a habit checkbox toggles it for today (or for the selected day)
- Tapping a day on the calendar shows that day's checklist below
- Month navigation arrows to go forward/back
- "See Full History" button opens scrollable history view

### Create/Edit Habit (`/habits/create`)

```
┌─ New Habit ─────────────────────┐
│                                 │
│  Name: [Creatine              ] │
│                                 │
│  Reminder: [Off / 08:00 AM]    │
│                                 │
│  [Save]                         │
└─────────────────────────────────┘
```

- Name: required, `AppInput`
- Reminder: optional toggle + time picker
- On save: create habit + schedule notification if reminder is set

### Per-Habit Detail (`/habits/[id]`)

```
┌─ Creatine ──────────────────────┐
│                                 │
│  Current streak: 14 days        │
│  Longest streak: 45 days        │
│  Completion rate: 89%           │
│  Total completions: 156         │
│                                 │
│  ← March 2026 →                 │
│  (calendar grid for this habit) │
│                                 │
│  [See Full History]             │
│  [Edit]  [Delete]               │
└─────────────────────────────────┘
```

### Full History View (`/habits/history` or `/habits/[id]/history`)

- `FlatList` of month grids, starting from current month, scrolling down for older months
- Each month is a compact 7-column grid
- Works for both "all habits" overview and single-habit history
- Stats summary pinned at top

### Smart Reminders

1. When a habit with a reminder is created, schedule a daily local notification at the specified time
2. When the user marks the habit as done for today, cancel today's pending notification for that habit
3. If the habit is not done by the reminder time, the notification fires with body: "Time to take {habitName}!"
4. Notification includes a **"Mark as done"** action button
5. Tapping the action button marks the habit done without opening the app (background handler)
6. Next day, the notification is automatically re-scheduled (daily repeating)

**Implementation detail:** Since daily repeating notifications can't be conditionally skipped, use **one-time notifications** scheduled each day instead:

- On app open (or midnight): schedule today's reminder for each habit that isn't done yet
- When habit is marked done: cancel its pending notification for today
- When notification fires and user taps "Mark as done": mark it done + don't reschedule

### Feed Integration

- At end of day (or when all habits are done), create/update a feed item of type `habit_summary`
- Feed card shows: "Habits: 3/3 completed" with a small calendar snippet or streak info
- Only one feed item per day (upsert pattern)

---

## Step 1: Database Migration

### `supabase/migrations/20260305200000_add_habits.sql`

```sql
-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reminder_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit logs (one entry per habit per day)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own habit logs"
  ON habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast date-range queries
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, completed_date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, completed_date);
```

### RPC: `habit_toggle_log`

```sql
DROP FUNCTION IF EXISTS habit_toggle_log;
CREATE FUNCTION habit_toggle_log(
  p_user_id UUID,
  p_habit_id UUID,
  p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = p_user_id;
    RETURN false; -- unchecked
  ELSE
    INSERT INTO habit_logs (user_id, habit_id, completed_date)
    VALUES (p_user_id, p_habit_id, p_date);
    RETURN true; -- checked
  END IF;
END;
$$;
```

### RPC: `habit_get_stats`

```sql
DROP FUNCTION IF EXISTS habit_get_stats;
CREATE FUNCTION habit_get_stats(
  p_user_id UUID,
  p_habit_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total INT;
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_streak INT := 0;
  v_prev_date DATE;
  v_first_date DATE;
  v_total_days INT;
  rec RECORD;
BEGIN
  -- Total completions
  SELECT COUNT(*) INTO v_total
  FROM habit_logs WHERE habit_id = p_habit_id AND user_id = p_user_id;

  -- First log date for completion rate
  SELECT MIN(completed_date) INTO v_first_date
  FROM habit_logs WHERE habit_id = p_habit_id AND user_id = p_user_id;

  IF v_first_date IS NULL THEN
    RETURN json_build_object(
      'total', 0, 'current_streak', 0, 'longest_streak', 0, 'completion_rate', 0
    );
  END IF;

  v_total_days := GREATEST((CURRENT_DATE - v_first_date)::INT + 1, 1);

  -- Calculate streaks by iterating dates in reverse order
  FOR rec IN
    SELECT completed_date FROM habit_logs
    WHERE habit_id = p_habit_id AND user_id = p_user_id
    ORDER BY completed_date DESC
  LOOP
    IF v_prev_date IS NULL THEN
      -- First iteration
      v_streak := 1;
      -- Current streak only counts if includes today or yesterday
      IF rec.completed_date >= CURRENT_DATE - 1 THEN
        v_current_streak := 1;
      END IF;
    ELSIF v_prev_date - rec.completed_date = 1 THEN
      -- Consecutive day
      v_streak := v_streak + 1;
      IF v_current_streak > 0 THEN
        v_current_streak := v_streak;
      END IF;
    ELSE
      -- Streak broken
      IF v_streak > v_longest_streak THEN
        v_longest_streak := v_streak;
      END IF;
      v_streak := 1;
      -- Current streak is already finalized
    END IF;
    v_prev_date := rec.completed_date;
  END LOOP;

  IF v_streak > v_longest_streak THEN
    v_longest_streak := v_streak;
  END IF;

  RETURN json_build_object(
    'total', v_total,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'completion_rate', ROUND((v_total::NUMERIC / v_total_days) * 100)
  );
END;
$$;
```

---

## Step 2: Database Functions (TypeScript)

**Direct queries** for simple single-table operations, **RPCs** only for atomic/complex logic.

### `database/habits/get-habits.ts` (NEW) — Direct query

- `supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true).order('sort_order')`
- Returns list of active habits

### `database/habits/save-habit.ts` (NEW) — Direct query

- `supabase.from('habits').insert({ user_id, name, reminder_time, sort_order }).select().single()`
- Calculates `sort_order` client-side (current habits length)
- Returns the new habit

### `database/habits/edit-habit.ts` (NEW) — Direct query

- `supabase.from('habits').update({ name, reminder_time }).eq('id', habitId).eq('user_id', userId)`

### `database/habits/delete-habit.ts` (NEW) — Direct query

- `supabase.from('habits').update({ is_active: false }).eq('id', habitId).eq('user_id', userId)`
- Soft delete — keeps history

### `database/habits/get-habit-logs.ts` (NEW) — Direct query

- `supabase.from('habit_logs').select('habit_id, completed_date').eq('user_id', userId).gte('completed_date', startDate).lte('completed_date', endDate)`
- Optional `.eq('habit_id', habitId)` filter for single-habit view
- Returns array of `{ habit_id, completed_date }`

### `database/habits/toggle-habit-log.ts` (NEW) — RPC

- Calls `habit_toggle_log` RPC with habit_id and date
- Needs RPC because it atomically checks existence then INSERTs or DELETEs
- Returns boolean (true = now completed, false = now unchecked)

### `database/habits/get-habit-stats.ts` (NEW) — RPC

- Calls `habit_get_stats` RPC
- Needs RPC because of complex streak calculation logic in SQL
- Returns `{ total, current_streak, longest_streak, completion_rate }`

---

## Step 3: Types

### `types/habit.ts` (NEW)

```ts
export type Habit = {
  id: string;
  user_id: string;
  name: string;
  reminder_time: string | null; // "HH:MM:SS" or null
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  completed_date: string; // "YYYY-MM-DD"
};

export type HabitStats = {
  total: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number; // 0-100
};

export type DayStatus = "all" | "partial" | "none" | "empty";
```

---

## Step 4: React Query Hooks

### `features/habits/hooks/useHabits.ts` (NEW)

- `useQuery` to fetch all active habits via `get-habits.ts`
- Query key: `["habits"]`

### `features/habits/hooks/useHabitLogs.ts` (NEW)

- `useQuery` to fetch logs for a date range via `get-habit-logs.ts`
- Query key: `["habit-logs", startDate, endDate, habitId?]`
- Used by both the main calendar and per-habit calendar

### `features/habits/hooks/useHabitStats.ts` (NEW)

- `useQuery` to fetch stats for a single habit
- Query key: `["habit-stats", habitId]`

### `features/habits/hooks/useToggleHabit.ts` (NEW)

- `useMutation` calling `toggle-habit-log.ts`
- On success: invalidate `["habit-logs"]` and `["habit-stats"]` queries
- Cancel today's notification for this habit if toggled to done

### `features/habits/hooks/useSaveHabit.ts` (NEW)

- `useMutation` calling `save-habit.ts`
- On success: invalidate `["habits"]`, schedule notification if reminder_time set

### `features/habits/hooks/useEditHabit.ts` (NEW)

- `useMutation` calling `edit-habit.ts`
- On success: invalidate `["habits"]`, reschedule/cancel notification as needed

### `features/habits/hooks/useDeleteHabit.ts` (NEW)

- `useMutation` calling `delete-habit.ts`
- On success: invalidate `["habits"]`, cancel notification

---

## Step 5: Components

### `features/habits/components/HabitChecklist.tsx` (NEW)

- Renders list of habits with checkboxes for a specific date
- Each row: checkbox + habit name + tap to toggle
- Uses `AnimatedButton` for each row (not raw `Pressable`)
- Checkbox: filled circle when done, empty circle when not

### `features/habits/components/MonthGrid.tsx` (NEW)

- Renders a single month as a 7-column grid
- Header: month name + year
- Day labels row: Mo Tu We Th Fr Sa Su
- Day cells: colored based on `DayStatus`
  - `"all"` → green/blue filled circle
  - `"partial"` → half-filled or lighter color circle
  - `"none"` → red/gray empty circle
  - `"empty"` → no indicator (future dates or dates before habit started)
- Tappable days: `onDayPress(date)` callback
- Built with `View` + `flexWrap` or manual rows (7 items each)

### `features/habits/components/StatsCard.tsx` (NEW)

- Displays current streak, longest streak, completion rate, total completions
- Used in per-habit detail view
- Simple grid layout with `AppText`

### `features/habits/components/HabitRow.tsx` (NEW)

- Single habit row for the main list
- Tap to toggle + long press or swipe to navigate to detail
- Shows habit name + today's status

---

## Step 6: Notifications

### `features/habits/hooks/useHabitNotifications.ts` (NEW)

Schedule and cancel habit reminder notifications.

**Scheduling:**

- Uses `expo-notifications` to schedule notifications (same pattern as `features/reminders/hooks/daily/useSetNotification.ts`)
- Schedules as daily repeating notification
- Notification content:
  - title: habit name
  - body: from translations (e.g. "Time to take Creatine!")
  - categoryIdentifier: `"habit-done"` (new category for "Mark as done" action)
  - data: `{ habitId, type: "habit" }`

**New notification category** — register in push notification setup:

```ts
export const HABIT_DONE_CATEGORY_ID = "habit-done";
export const HABIT_DONE_ACTION_ID = "mark-done";
```

Register the category with action button:

```ts
Notifications.setNotificationCategoryAsync(HABIT_DONE_CATEGORY_ID, [
  {
    identifier: HABIT_DONE_ACTION_ID,
    buttonTitle: t("habits.markAsDone"), // "Mark as done"
    options: { opensApp: false },
  },
]);
```

**Background handler** — in the notification response listener:

- When `actionIdentifier === HABIT_DONE_ACTION_ID`:
  - Extract `habitId` from notification data
  - Call `toggle-habit-log.ts` with today's date
  - Cancel the notification

**Cancellation on completion:**

- When user marks a habit done (via checklist or notification), cancel its pending notification
- Use notification identifier stored per habit (store in AsyncStorage: `habit-notif-{habitId}`)

---

## Step 7: Pages

### `app/habits/index.tsx` (NEW) — Main habits screen

- Wrapped with `ModalPageWrapper`
- Sections:
  1. **Today's checklist** — `HabitChecklist` for today (or selected date)
  2. **Month calendar** — `MonthGrid` with navigation arrows
  3. **Add habit button** — navigates to `/habits/create`
- Tapping a day on the calendar updates the checklist to show that day
- If no habits exist, show empty state with "Create your first habit" prompt
- Keyboard dismiss wrapper (if future text inputs added)

### `app/habits/create.tsx` (NEW) — Create/edit habit

- Wrapped with `ModalPageWrapper`
- Fields:
  - `AppInput` for habit name
  - Toggle for reminder on/off
  - Time picker (shown when reminder is on) — reuse existing time picker pattern from reminders
- `SaveButton` to create
- If editing (route param `id`): pre-fill fields, save calls `useEditHabit`
- On save with reminder: schedule notification
- On save without reminder (or reminder removed): cancel any existing notification
- Keyboard dismiss on tap outside

### `app/habits/[id].tsx` (NEW) — Habit detail

- Wrapped with `ModalPageWrapper`
- Shows:
  - `StatsCard` with streak/completion info
  - `MonthGrid` for this habit only (navigate months)
  - "See Full History" button → `/habits/[id]/history`
  - Edit button → `/habits/create?id={habitId}`
  - Delete button (with confirmation) → soft-deletes, navigates back

### `app/habits/[id]/history.tsx` (NEW) — Full history

- Wrapped with `ModalPageWrapper`
- `StatsCard` pinned at top
- `FlatList` of `MonthGrid` components
- Starts from current month, loads older months as user scrolls down
- Each month fetches its own log data (or batch-fetch on mount)
- Can be used for all-habits overview or single-habit (based on route param)

---

## Step 8: Navigation Integration

### Sessions page (`app/sessions/index.tsx`)

Add habits link:

```tsx
<LinkButton label={t("sessions.habits")} href="/habits">
  <CalendarCheck size={20} color="#f3f4f6" />
</LinkButton>
```

Use `CalendarCheck` icon from `lucide-react-native`.

### Menu page (`app/menu/index.tsx`)

Add habits link in appropriate section (near reminders/todo).

---

## Step 9: Translations

### `locales/en/habits.json` (NEW)

```json
{
  "title": "Habits",
  "todayHabits": "Today's Habits",
  "noHabits": "No habits yet",
  "createFirst": "Create your first habit",
  "addHabit": "Add Habit",
  "editHabit": "Edit Habit",
  "habitName": "Habit Name",
  "habitNamePlaceholder": "e.g. Creatine, Vitamins...",
  "reminder": "Reminder",
  "reminderTime": "Reminder Time",
  "save": "Save",
  "delete": "Delete Habit",
  "deleteConfirm": "Are you sure you want to delete this habit? History will be preserved.",
  "stats": {
    "currentStreak": "Current Streak",
    "longestStreak": "Longest Streak",
    "completionRate": "Completion Rate",
    "totalCompletions": "Total Completions",
    "days": "days"
  },
  "seeFullHistory": "See Full History",
  "allDone": "All habits done!",
  "markAsDone": "Mark as done",
  "reminderBody": "Time to {{habitName}}!",
  "saved": "Habit saved!",
  "deleted": "Habit deleted",
  "errorSaving": "Failed to save habit",
  "errorDeleting": "Failed to delete habit"
}
```

### `locales/fi/habits.json` (NEW)

```json
{
  "title": "Tavat",
  "todayHabits": "Tämän päivän tavat",
  "noHabits": "Ei vielä tapoja",
  "createFirst": "Luo ensimmäinen tapa",
  "addHabit": "Lisää tapa",
  "editHabit": "Muokkaa tapaa",
  "habitName": "Tavan nimi",
  "habitNamePlaceholder": "esim. Kreatiini, Vitamiinit...",
  "reminder": "Muistutus",
  "reminderTime": "Muistutusaika",
  "save": "Tallenna",
  "delete": "Poista tapa",
  "deleteConfirm": "Haluatko varmasti poistaa tämän tavan? Historia säilytetään.",
  "stats": {
    "currentStreak": "Nykyinen putki",
    "longestStreak": "Pisin putki",
    "completionRate": "Suoritusprosentti",
    "totalCompletions": "Suorituksia yhteensä",
    "days": "päivää"
  },
  "seeFullHistory": "Näytä koko historia",
  "allDone": "Kaikki tavat tehty!",
  "markAsDone": "Merkitse tehdyksi",
  "reminderBody": "Aika ottaa {{habitName}}!",
  "saved": "Tapa tallennettu!",
  "deleted": "Tapa poistettu",
  "errorSaving": "Tavan tallennus epäonnistui",
  "errorDeleting": "Tavan poistaminen epäonnistui"
}
```

### Update `locales/en/sessions.json`

Add: `"habits": "Habits"`

### Update `locales/fi/sessions.json`

Add: `"habits": "Tavat"`

---

## Step 10: Feed Integration (Optional — Phase 2)

This can be added later as a separate enhancement:

- Create a `habit_summary` feed item type
- Daily upsert when habits are toggled
- Feed card showing "Habits: 2/3 completed" with streak info
- Share card support

---

## Files Summary

| Action     | File                                                            |
| ---------- | --------------------------------------------------------------- |
| **Create** | `supabase/migrations/20260305200000_add_habits.sql`             |
| **Create** | `types/habit.ts`                                                |
| **Create** | `database/habits/save-habit.ts`                                 |
| **Create** | `database/habits/edit-habit.ts`                                 |
| **Create** | `database/habits/delete-habit.ts`                               |
| **Create** | `database/habits/toggle-habit-log.ts`                           |
| **Create** | `database/habits/get-habits.ts`                                 |
| **Create** | `database/habits/get-habit-logs.ts`                             |
| **Create** | `database/habits/get-habit-stats.ts`                            |
| **Create** | `features/habits/hooks/useHabits.ts`                            |
| **Create** | `features/habits/hooks/useHabitLogs.ts`                         |
| **Create** | `features/habits/hooks/useHabitStats.ts`                        |
| **Create** | `features/habits/hooks/useToggleHabit.ts`                       |
| **Create** | `features/habits/hooks/useSaveHabit.ts`                         |
| **Create** | `features/habits/hooks/useEditHabit.ts`                         |
| **Create** | `features/habits/hooks/useDeleteHabit.ts`                       |
| **Create** | `features/habits/hooks/useHabitNotifications.ts`                |
| **Create** | `features/habits/components/HabitChecklist.tsx`                 |
| **Create** | `features/habits/components/MonthGrid.tsx`                      |
| **Create** | `features/habits/components/StatsCard.tsx`                      |
| **Create** | `features/habits/components/HabitRow.tsx`                       |
| **Create** | `app/habits/index.tsx`                                          |
| **Create** | `app/habits/create.tsx`                                         |
| **Create** | `app/habits/[id].tsx`                                           |
| **Create** | `app/habits/[id]/history.tsx`                                   |
| **Create** | `locales/en/habits.json`                                        |
| **Create** | `locales/fi/habits.json`                                        |
| **Edit**   | `app/sessions/index.tsx` — add habits link                      |
| **Edit**   | `app/menu/index.tsx` — add habits link                          |
| **Edit**   | `locales/en/sessions.json` — add habits translation             |
| **Edit**   | `locales/fi/sessions.json` — add habits translation             |
| **Edit**   | `features/push-notifications/constants.ts` — add habit category |
| **Edit**   | Push notification setup — register habit-done category          |
| **Edit**   | Notification response handler — handle mark-done action         |
| **Edit**   | `locales/en/index.ts` — register habits namespace               |
| **Edit**   | `locales/fi/index.ts` — register habits namespace               |

---

## Verification

1. **Create habit**: Sessions → Habits → Add Habit → enter "Creatine" with reminder at 08:00 → Save → habit appears in today's checklist
2. **Toggle habit**: Tap checkbox → habit marked as done → calendar day updates
3. **Untoggle**: Tap again → habit unchecked → calendar reverts
4. **Calendar navigation**: Tap month arrows → shows different months with correct completion data
5. **Tap past day**: Tap a previous day on calendar → checklist updates to show that day's status → can retroactively mark/unmark
6. **Habit detail**: Tap habit name → detail view shows stats (streak, completion rate) and per-habit calendar
7. **Full history**: Tap "See Full History" → scrollable list of months with completion indicators
8. **Smart reminder**: Set reminder for 2 min from now → don't mark done → notification fires with "Mark as done" button
9. **Cancel on completion**: Set reminder → mark habit done before reminder time → notification does NOT fire
10. **Notification action**: Let notification fire → tap "Mark as done" → habit is marked done without opening app
11. **Edit habit**: Edit name/reminder → changes reflected immediately
12. **Delete habit**: Delete → habit removed from checklist, history preserved in database
13. **Multiple habits**: Create 3 habits → complete 2 → calendar shows partial indicator (◐) for that day
14. **Translations**: Switch language to Finnish → all text shows in Finnish with proper ä/ö characters
