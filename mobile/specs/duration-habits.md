# Duration Habits

## Overview

Add a new `"duration"` habit type that integrates with the existing timer system. Users set a daily time target (e.g., "Stand 30 min"), start/stop a countdown timer that accumulates throughout the day, and get automatically marked done when the target is reached.

The feature reuses the existing timer infrastructure: `timerStore`, `TimerService` foreground notification, `AlarmScheduler`, `AlarmActivity` full-screen intent, and `ActiveSessionPopup`.

---

## Design Decisions

### Why reuse the existing timer?

| Option | Verdict |
|--------|---------|
| Separate habit timer service | Adds native code complexity, duplicate notification logic |
| Reuse existing timer + store | **Chosen** — zero native changes, consistent UX, big countdown display on desk |

Trade-off: only one timer at a time. If user is running a habit timer and wants to start a workout timer, they must pause the habit timer first. The accumulated time is safely stored, so they can always resume later.

### Accumulated time model

Duration habits don't require finishing in one go. The user can start/stop multiple times throughout the day, and the elapsed time accumulates toward the target.

**Storage:** A new `accumulated_seconds` INTEGER column on `habit_logs`. Each start/pause cycle calculates elapsed seconds and adds to the accumulated total. When `accumulated_seconds >= target_value`, the habit is marked complete.

### Alarm options

Two completion modes, chosen per habit:

| Mode | Behavior |
|------|----------|
| **Normal** (default) | Regular notification with sound. Auto-marks habit done immediately. |
| **Priority alarm** | Full-screen intent + continuous looping alarm. User must tap Stop to dismiss. Then auto-marks done. |

Stored as `alarm_type TEXT DEFAULT 'normal'` on the `habits` table. Values: `'normal'`, `'priority'`.

---

## Database Schema

### 1. Add `"duration"` to habit type + new columns on `habits`

```sql
-- Drop the old CHECK constraint if one exists, then add the new one
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_type_check;
ALTER TABLE habits ADD CONSTRAINT habits_type_check
  CHECK (type IN ('manual', 'steps', 'duration'));

-- Alarm type for duration habits
ALTER TABLE habits
ADD COLUMN alarm_type TEXT NOT NULL DEFAULT 'normal'
CHECK (alarm_type IN ('normal', 'priority'));
```

### 2. Add `accumulated_seconds` to `habit_logs`

```sql
ALTER TABLE habit_logs
ADD COLUMN accumulated_seconds INTEGER DEFAULT NULL;
```

- `NULL` for manual/step habits (they don't track duration)
- Integer seconds for duration habits (e.g., 1800 for 30 min)
- Updated on every pause/stop cycle via upsert

### 3. Update `habit_toggle_log` RPC

Duration habits don't use the toggle — they use `markHabitDone` when accumulated time reaches the target. No changes needed to the toggle RPC.

### 4. Update `habit_get_stats` RPC

The stats RPC counts `habit_logs` entries. Duration habits create one log entry per day (upserted with accumulated seconds), so streaks and completion rate work as-is. A duration habit log counts as "completed" only when `accumulated_seconds >= target_value`.

```sql
-- In the stats calculation, treat duration logs as completed only when target met:
-- WHERE (h.type != 'duration' OR hl.accumulated_seconds >= h.target_value)
```

---

## Data Flow

### Starting the habit timer

1. User taps "Start" on a duration habit row
2. Check if another timer/session is active → show toast error if so
3. Load today's `habit_log` for this habit → get `accumulated_seconds` (default 0)
4. Calculate remaining: `target_value - accumulated_seconds`
5. Store habit context in AsyncStorage key `habit-timer-context`:
   ```json
   {
     "habitId": "uuid",
     "habitName": "Stand 30 min",
     "targetSeconds": 1800,
     "accumulatedAtStart": 600,
     "alarmType": "normal"
   }
   ```
6. Call `timerStore.startTimer(remainingSeconds, habitName)`
7. Call `timerStore.setActiveSession({ label: habitName, path: "/timer/empty-timer", type: "habit" })`
8. Schedule alarm:
   - **Normal:** `scheduleNativeAlarm(...)` with `soundType: "habit"` — fires once, auto-dismiss
   - **Priority:** `scheduleNativeAlarm(...)` with `soundType: "timer"` — full-screen + continuous alarm
9. `ActiveSessionPopup` appears automatically (it reads `activeSession` from store)

### Pausing the habit timer

1. User taps pause (on Timer component, notification, or ActiveSessionPopup)
2. `timerStore.pauseTimer()` fires → calculates `frozenMs` (remaining time)
3. Calculate elapsed this session: `(target - accumulated) - (frozenMs / 1000)`
4. Upsert `habit_logs` with new `accumulated_seconds = accumulatedAtStart + elapsed`
5. Update `habit-timer-context` in AsyncStorage with new accumulated value
6. Cancel the scheduled alarm
7. Native notification shows paused state with remaining time

### Resuming the habit timer

1. User taps resume (on notification or in-app)
2. Load `habit-timer-context` from AsyncStorage
3. Calculate remaining: `targetSeconds - accumulated_seconds`
4. `timerStore.resumeTimer(habitName)` fires
5. Reschedule alarm for new end time

### Timer reaches zero (completion)

**Normal alarm:**
1. JS interval detects `Date.now() >= endTimestamp`
2. `alarmFired = true`, `isRunning = false`
3. Native alarm fires regular notification with sound
4. Auto-completion logic runs immediately:
   - Call `markHabitDone(habitId, today)` → inserts/upserts habit_log + refreshes feed
   - Update `habit_logs.accumulated_seconds = targetSeconds`
   - Show toast: "Stand 30 min — Done!"
   - Invalidate queries: `["habit-logs"]`, `["habit-stats"]`, `["feed"]`
5. Clear timer state after short delay (let user see the completion)

**Priority alarm:**
1. Same detection as above
2. `AlarmActivity` shows full-screen intent with continuous alarm
3. User taps "Stop Alarm"
4. Then auto-completion runs (same as normal)
5. Clear timer state

### Cancelling mid-session

1. User taps cancel (X button on timer screen)
2. Confirm dialog: "Save progress and stop?"
3. If confirmed:
   - Calculate elapsed, update accumulated in DB
   - `clearEverything()` on timer store
   - Remove `habit-timer-context` from AsyncStorage
   - Accumulated time is preserved — user can resume later by starting again

### App killed / crash recovery

On app launch:
1. Check if `habit-timer-context` exists in AsyncStorage
2. Check `timerStore` persisted state (also in AsyncStorage)
3. If habit timer was running and `endTimestamp` has passed:
   - Calculate how much time elapsed before the end
   - Update accumulated in DB
   - Mark done if target reached
4. If habit timer was running and `endTimestamp` hasn't passed:
   - Resume normally (timer store handles this via persistence)

---

## UI Changes

### Habit Creation (`app/habits/create.tsx`)

Add `"duration"` as a third habit type option (alongside Manual and Steps):

```
[Manual]  [Steps]  [Duration]
```

When `duration` is selected:
- Show name input (like manual)
- Show duration picker using `TimerPicker` component (hours + minutes, no seconds)
  - This sets `target_value` in seconds
- Show frequency selection (daily / specific days)
- Show alarm type toggle:
  ```
  Alarm Type
  [Normal]  [Priority]
  ```
  Normal = notification + sound
  Priority = full-screen alarm + continuous sound
- Show reminder toggle (same as manual — this is a reminder to START the habit, separate from the completion alarm)

### Habit Row (`features/habits/components/HabitRow.tsx`)

For duration habits, the row shows:

```
+-----------------------------------------------+
|  Stand 30 min          [▶ Start] or [Toggle]  |
|  ██████████░░░░░░░░░░░░░░░  20:00 / 30:00    |
+-----------------------------------------------+
```

- When NOT started and NOT completed: Show "Start" button (play icon) instead of toggle
- When timer is RUNNING for this habit: Show "Pause" button and live countdown
- When PAUSED with accumulated time: Show "Resume" button + accumulated progress
- When COMPLETED: Show green toggle (checked) + "30:00 / 30:00"

Progress bar: same style as step habits but showing minutes.
Text below bar: `"MM:SS / MM:SS"` format (accumulated / target).

New prop: `habitTimerState?: "idle" | "running" | "paused"` — derived from checking if the active timer session matches this habit.

### Timer Screen (`app/timer/empty-timer/index.tsx`)

When the active session type is `"habit"`:
- Timer display works as-is (countdown mode)
- Progress bar works as-is
- Cancel button: saves accumulated progress, then clears
- **Hide the snooze/extend button** — doesn't make sense for habits
- When alarm fires:
  - Normal: show "Done!" message, auto-clear after delay
  - Priority: show Stop Alarm + Restart buttons (restart resets to full duration)

### ActiveSessionPopup

Add `"habit"` to the hide logic array so the popup hides when on the habits page:

```typescript
// Hide on habits page if habit timer is running
if (pathname === "/habits" && activeSession.type === "habit") return null;
```

### Habit Detail Page (`app/habits/[id]/index.tsx`)

For duration habits:
- Show target duration in the info box (like step habits show step target)
- Format: "30 minutes" or "1 hour 15 minutes"
- Stats work the same (streaks, completion rate based on completed days)

---

## Translations

### English (`locales/en/habits.json`)

```json
{
  "typeDuration": "Duration",
  "durationTarget": "Daily Target",
  "durationProgress": "{{current}} / {{target}}",
  "alarmType": "Completion Alarm",
  "alarmNormal": "Normal",
  "alarmPriority": "Priority",
  "alarmNormalDesc": "Notification with sound",
  "alarmPriorityDesc": "Full-screen alarm until dismissed",
  "habitTimerStart": "Start",
  "habitTimerPause": "Pause",
  "habitTimerResume": "Resume",
  "habitTimerDone": "{{habitName}} — Done!",
  "habitTimerActive": "Another timer is active. Pause it first.",
  "habitTimerCancelTitle": "Stop timer?",
  "habitTimerCancelMessage": "Your progress will be saved.",
  "durationCompleted": "Target reached!"
}
```

### Finnish (`locales/fi/habits.json`)

```json
{
  "typeDuration": "Kesto",
  "durationTarget": "Päivätavoite",
  "durationProgress": "{{current}} / {{target}}",
  "alarmType": "Valmistumishälytys",
  "alarmNormal": "Normaali",
  "alarmPriority": "Prioriteetti",
  "alarmNormalDesc": "Ilmoitus äänellä",
  "alarmPriorityDesc": "Koko näytön hälytys kunnes hylätty",
  "habitTimerStart": "Aloita",
  "habitTimerPause": "Tauko",
  "habitTimerResume": "Jatka",
  "habitTimerDone": "{{habitName}} — Valmis!",
  "habitTimerActive": "Toinen ajastin on käynnissä. Pysäytä se ensin.",
  "habitTimerCancelTitle": "Pysäytä ajastin?",
  "habitTimerCancelMessage": "Edistymisesi tallennetaan.",
  "durationCompleted": "Tavoite saavutettu!"
}
```

---

## Type Changes

### `types/habit.ts`

```typescript
export type Habit = {
  id: string;
  user_id: string;
  name: string;
  reminder_time: string | null;
  frequency_days: number[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  type: "manual" | "steps" | "duration";
  target_value: number | null;       // seconds for duration, steps for steps
  alarm_type: "normal" | "priority"; // NEW
};

export type HabitLog = {
  habit_id: string;
  completed_date: string;
  accumulated_seconds: number | null; // NEW — null for manual/steps
};
```

---

## New Files

### `features/habits/hooks/useHabitTimer.ts`

Central hook that manages starting, pausing, resuming, and completing habit timers.

**Responsibilities:**
- Read/write `habit-timer-context` from AsyncStorage
- Start timer via `timerStore.startTimer()`
- Set active session via `timerStore.setActiveSession()`
- Schedule/cancel alarms via `NativeAlarm`
- On pause: calculate elapsed, upsert accumulated to DB
- On completion: call `markHabitDone()`, invalidate queries, show toast
- On cancel: save progress, clear timer
- Expose: `startHabitTimer(habit)`, `pauseHabitTimer()`, `resumeHabitTimer()`, `cancelHabitTimer()`
- Expose: `activeHabitId` (derived from checking if timerStore.activeSession.type === "habit")

### `database/habits/upsert-habit-progress.ts`

Upserts the `habit_logs` row for today with updated `accumulated_seconds`.

```typescript
export async function upsertHabitProgress(
  habitId: string,
  date: string,
  accumulatedSeconds: number
) {
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      {
        habit_id: habitId,
        completed_date: date,
        accumulated_seconds: accumulatedSeconds,
      },
      { onConflict: "habit_id,completed_date" }
    );

  if (error) {
    handleError(error, { ... });
    throw new Error("Error updating habit progress");
  }
}
```

---

## Edge Cases

### Timer conflict
If user tries to start a habit timer while another timer/session is running, show toast: "Another timer is active. Pause it first." Don't force-stop the other timer.

### Already completed today
If the habit's `accumulated_seconds >= target_value` for today, show it as completed. The "Start" button becomes a green toggle. User can still manually uncomplete via toggle if needed.

### Midnight rollover
If user starts a habit timer at 23:50 and it runs past midnight, the elapsed time counts toward the day it was started on (the date stored in `habit-timer-context`). This matches how the rest of the app handles date boundaries.

### Extend beyond target
If timer reaches 0 and habit is marked done, but user taps "Restart" (priority alarm mode), it starts a fresh countdown from the full target. The accumulated seconds stay at the target — it just lets them do more time if they want, but doesn't increase the logged value beyond target.

### Partial day with no timer
User can also manually toggle a duration habit as done (via long-press or from detail page) if they tracked the time externally. This creates a log entry with `accumulated_seconds = target_value`.

---

## Implementation Order

1. **Database migration** — add `alarm_type` to habits, `accumulated_seconds` to habit_logs, update type check
2. **Type updates** — update `Habit` and `HabitLog` types
3. **Database functions** — add `upsert-habit-progress.ts`, update `save-habit.ts` and `edit-habit.ts` to accept duration type + alarm_type
4. **useHabitTimer hook** — core timer integration logic
5. **HabitRow update** — show start/pause/resume button + progress bar for duration habits
6. **Create/edit screen** — add duration type option with TimerPicker and alarm type toggle
7. **Timer screen tweaks** — hide extend button for habit timers, add completion handling
8. **ActiveSessionPopup** — add "habit" to hide logic
9. **Translations** — add all new keys
10. **Stats RPC update** — treat duration logs as completed only when target met
11. **Crash recovery** — handle app restart with pending habit timer
