# Step Habit — Auto-completing Habits from Step Counter

## Overview

Add a new habit type that links to the native step counter. When the user creates a "steps" habit with a target (e.g., 5,000 steps), the app automatically marks it as done when today's step count reaches the target. A notification is sent when the goal is reached.

Android only — the native step counter module (`NativeStepCounter`) only exists for Android.

---

## Design Decisions

### Why not just use the widget step goal?

The widget (`StepsConfig.dailyGoal`) is display-only — it shows a progress bar on the home screen but doesn't track completion history, streaks, or integrate with the habit system. A step habit gives the user:
- Streak tracking and completion rate stats
- Monthly calendar view of completion
- Integration with the "all habits done" confetti celebration
- Share with friends (future social feed)

### One step habit or multiple?

Allow multiple step habits with different targets. A user might want both "5,000 steps" (daily minimum) and "10,000 steps" (stretch goal). Each is tracked independently.

### Should step habits be toggleable manually?

Yes — as a fallback. The primary UX is auto-completion (progress bar fills up, habit auto-marks when target is reached). But the user can also manually toggle it done/undone. This covers cases where auto-completion fails:
- User didn't open the app that day (notification fired but DB log wasn't written)
- Step sensor glitch underreported steps
- Aggressive battery optimization stopped the foreground service

Without manual toggle, a missed auto-completion means a broken streak with no way to fix it. That's more frustrating than the feature is worth. Manual toggle is the safety net.

**UI:** Step habits show a progress bar (primary) with a toggle button at the end (same as manual habits). The toggle is pre-filled by auto-completion but the user can override it.

### Frequency support?

Yes. Step habits support the same `frequency_days` as manual habits. If a step habit is only scheduled for weekdays, it only auto-checks and auto-completes on those days.

---

## Database Schema

### 1. Add columns to `habits` table

```sql
ALTER TABLE habits ADD COLUMN type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE habits ADD COLUMN target_value INTEGER;

-- Ensure step habits always have a target
ALTER TABLE habits ADD CONSTRAINT habits_step_target_check
  CHECK (type = 'manual' OR target_value IS NOT NULL);
```

No new tables needed. Step habits use the same `habit_logs` table for completion tracking.

---

## Native Implementation (Kotlin)

The goal notification must fire even when the app is killed. The `StepTrackingService` is already a foreground service that runs 24/7 and receives every step event via `onSensorChanged`. We add the goal check there.

### How it works

1. JS writes step habit targets to SharedPreferences when a habit is created/edited/deleted
2. `StepTrackingService.onSensorChanged` — after recording steps, checks today's total against targets
3. When target is reached and not already notified today → fires a native Android notification
4. Resets the "notified" flags at midnight

### 1. JS bridge: save targets to SharedPreferences

**Modify: `StepCounterModule.kt`** — add a new `@ReactMethod`:

```kotlin
@ReactMethod
fun setStepGoals(goals: ReadableArray, notifTitle: String, notifBody: String) {
    // goals is an array of integers, e.g. [5000, 10000]
    // notifTitle/notifBody are pre-translated strings from JS
    // notifBody uses {{steps}} as placeholder, replaced at notification time
    val prefs = reactContext.getSharedPreferences("step_goals_prefs", Context.MODE_PRIVATE)
    val jsonArray = org.json.JSONArray()
    for (i in 0 until goals.size()) {
        jsonArray.put(goals.getInt(i))
    }
    prefs.edit()
        .putString("step_goals", jsonArray.toString())
        .putString("notif_title", notifTitle)
        .putString("notif_body", notifBody)
        .apply()

    // Tell the running service to reload goals immediately
    val intent = Intent(reactContext, StepTrackingService::class.java)
    intent.action = "RELOAD_GOALS"
    reactContext.startService(intent)
}
```

Handle the intent in `StepTrackingService.onStartCommand`:

```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == "RELOAD_GOALS") {
        reloadGoals()
        return START_STICKY
    }
    // ... existing setup code
}
```

**Modify: `NativeStepCounter.ts`** — add the JS wrapper:

```ts
export function setStepGoals(goals: number[], notifTitle: string, notifBody: string): void {
  if (Platform.OS === "android" && nativeStepCounter) {
    nativeStepCounter.setStepGoals(goals, notifTitle, notifBody);
  }
}
```

### 2. Goal checker in StepTrackingService

**Modify: `StepTrackingService.kt`**

Add goal checking logic to `onSensorChanged`. Cache parsed goals in memory to avoid re-parsing JSON on every single step event:

```kotlin
// Instance variables — cached in memory
private var cachedGoals: IntArray = intArrayOf()
private var goalsLoadedForDate: String = ""

override fun onSensorChanged(event: SensorEvent) {
    val currentValue = event.values[0].toLong()
    val h = helper ?: return
    h.recordReadingWithValue(currentValue)

    // Check step goals
    checkStepGoals(h.getTodaySteps())
}

fun reloadGoals() {
    // Called when JS updates SharedPreferences via setStepGoals
    val goalPrefs = getSharedPreferences("step_goals_prefs", Context.MODE_PRIVATE)
    val goalsJson = goalPrefs.getString("step_goals", "[]") ?: "[]"
    val arr = org.json.JSONArray(goalsJson)
    cachedGoals = IntArray(arr.length()) { arr.getInt(it) }
}

private fun checkStepGoals(todaySteps: Long) {
    // Reload goals once per day (picks up changes + resets notified flags)
    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
    if (goalsLoadedForDate != today) {
        reloadGoals()
        goalsLoadedForDate = today
    }

    if (cachedGoals.isEmpty()) return

    val notifiedPrefs = getSharedPreferences("step_goals_notified", Context.MODE_PRIVATE)
    val notifiedDate = notifiedPrefs.getString("notified_date", "")

    // Reset notified flags if it's a new day
    if (notifiedDate != today) {
        notifiedPrefs.edit()
            .putString("notified_date", today)
            .putStringSet("notified_goals", emptySet())
            .apply()
    }

    val notifiedGoals = notifiedPrefs.getStringSet("notified_goals", emptySet())!!.toMutableSet()

    for (target in cachedGoals) {
        val key = target.toString()
        if (todaySteps >= target && key !in notifiedGoals) {
            notifiedGoals.add(key)
            fireGoalReachedNotification(target)
        }
    }

    notifiedPrefs.edit()
        .putStringSet("notified_goals", notifiedGoals)
        .apply()
}
```

### 3. Fire the goal notification

**Add to `StepTrackingService.kt`:**

```kotlin
private fun fireGoalReachedNotification(target: Int) {
    val channelId = "step_goal_channel"
    val notificationManager = getSystemService(NotificationManager::class.java)

    // Create channel if needed (idempotent)
    val channel = NotificationChannel(
        channelId,
        "Step Goals",
        NotificationManager.IMPORTANCE_HIGH
    ).apply {
        description = "Notifications when you reach your step goal"
    }
    notificationManager.createNotificationChannel(channel)

    val formattedTarget = java.text.NumberFormat.getNumberInstance(java.util.Locale.getDefault()).format(target)

    // Read translated strings from SharedPreferences (written by JS)
    val goalPrefs = getSharedPreferences("step_goals_prefs", Context.MODE_PRIVATE)
    val title = goalPrefs.getString("notif_title", "Step goal reached!") ?: "Step goal reached!"
    // Replace {{steps}} placeholder with formatted target
    val bodyTemplate = goalPrefs.getString("notif_body", "You hit {{steps}} steps today!") ?: "You hit {{steps}} steps today!"
    val body = bodyTemplate.replace("{{steps}}", formattedTarget)

    val openAppIntent = Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val pendingIntent = PendingIntent.getActivity(
        this, target, openAppIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = Notification.Builder(this, channelId)
        .setContentTitle(title)
        .setContentText(body)
        .setSmallIcon(R.drawable.small_notification_icon)
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .build()

    // Use target as notification ID so each goal gets its own notification
    notificationManager.notify(target, notification)
}
```

### 4. Sync goals from JS to SharedPreferences

**Create: `features/habits/hooks/useStepGoalSync.ts`**

This hook runs once on mount and whenever step habits change. It writes the current active step habit targets to SharedPreferences so the native service can read them.

```ts
import { useEffect } from "react";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { setStepGoals } from "@/native/android/NativeStepCounter";
import { useTranslation } from "react-i18next";

export function useStepGoalSync() {
  const { t } = useTranslation("habits");
  const { data: habits = [] } = useHabits();

  const stepTargets = habits
    .filter((h) => h.type === "steps" && h.target_value)
    .map((h) => h.target_value!);

  useEffect(() => {
    setStepGoals(
      stepTargets,
      t("stepGoalReached"),
      t("stepGoalBody", { steps: "{{steps}}" }), // keep placeholder for native side
    );
  }, [JSON.stringify(stepTargets), t]);
}
```

Mount in `_layout.tsx` or `LayoutWrapper` so it runs on app start.

Also call `setStepGoals` after saving/editing/deleting/archiving a step habit to update immediately.

---

## Mobile Implementation (JS)

### 1. Update Habit type

**Modify: `types/habit.ts`**

```ts
export type Habit = {
  id: string;
  user_id: string;
  name: string;
  reminder_time: string | null;
  frequency_days: number[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  type: "manual" | "steps";       // NEW
  target_value: number | null;    // NEW — step target (e.g., 5000)
};
```

### 2. Update habit save

**Modify: `database/habits/save-habit.ts`**

Add `type` and `target_value` to the insert payload:

```ts
export async function saveHabit({
  name,
  reminderTime,
  frequencyDays,
  sortOrder,
  type = "manual",
  targetValue = null,
}: {
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  sortOrder: number;
  type?: "manual" | "steps";
  targetValue?: number | null;
}) {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      name,
      reminder_time: reminderTime,
      frequency_days: frequencyDays,
      sort_order: sortOrder,
      type,
      target_value: targetValue,
    })
    .select()
    .single();
  // ...
}
```

### 2b. Update habit edit

**Modify: `database/habits/edit-habit.ts`**

Add `type` and `target_value` to the update payload:

```ts
export async function editHabit({
  habitId,
  name,
  reminderTime,
  frequencyDays,
  targetValue,
}: {
  habitId: string;
  name: string;
  reminderTime: string | null;
  frequencyDays: number[] | null;
  targetValue?: number | null;
}) {
  const { error } = await supabase
    .from("habits")
    .update({
      name,
      reminder_time: reminderTime,
      frequency_days: frequencyDays,
      target_value: targetValue ?? null,
    })
    .eq("id", habitId);
  // ...
}
```

Note: `type` is not editable — you can't change a manual habit to a step habit or vice versa. The user would archive and create a new one.

### 3. Update create/edit page

**Modify: `app/habits/create.tsx`**

Add a habit type selector at the top of the form:

```
+------------------------------------------+
|  Habit Type                              |
|  [Manual]  [Steps]                       |
|------------------------------------------|
|  (if Manual selected — current form)     |
|  Habit Name: [________________]          |
|                                          |
|  (if Steps selected)                     |
|  Step Goal: [________] steps             |
|                                          |
|  Frequency                               |
|  [Daily]  [Specific Days]               |
|                                          |
|  Reminder (hidden for step habits)       |
+------------------------------------------+
```

Changes:
- Add `habitType` state: `"manual" | "steps"` (default `"manual"`)
- Add `stepGoal` state: `string` (numeric input)
- When `habitType === "steps"`:
  - Replace the name input with a numeric input for step goal
  - Auto-generate the habit name: `"${stepGoal} ${t('steps')}"` (e.g., "5000 steps")
  - Hide the reminder section (step habits use the auto-notification instead)
- When saving a step habit:
  - `type: "steps"`
  - `targetValue: parseInt(stepGoal)`
  - `name: t("stepHabitName", { steps: stepGoal })` (e.g., "5 000 steps")
  - `reminderTime: null` (no scheduled reminder — notification fires on goal reached)
- When editing: if the existing habit has `type === "steps"`, show the steps form pre-filled

### 4. Auto-completion hook (database sync)

**Create: `features/habits/hooks/useStepHabitAutoComplete.ts`**

The native service handles the notification, but it can't write to Supabase. This JS hook handles the database side — marking `habit_logs` when the target is reached. It runs when the app is open.

**Important:** The existing `addLiveStepListener` / `startLiveStepUpdates` is designed for **activity sessions only** — it emits session-relative steps and requires `startSession()` to be called first. It does NOT emit daily totals. This hook uses **polling** instead: calls `getTodaySteps()` every 30 seconds while the app is open.

```ts
import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import { markHabitDone } from "@/database/habits/mark-habit-done";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useStepHabitAutoComplete() {
  const today = new Date().toLocaleDateString("en-CA");
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs({ startDate: today, endDate: today });
  const queryClient = useQueryClient();
  const completedRef = useRef<Set<string>>(new Set());

  const stepHabits = habits.filter(
    (h) => h.type === "steps" && h.target_value && isHabitScheduledForDate(h, today)
  );

  const completedSet = new Set(
    logs.filter((l) => l.completed_date === today).map((l) => l.habit_id)
  );

  const checkAndComplete = useCallback(async () => {
    if (Platform.OS !== "android") return;

    const currentSteps = await getTodaySteps();
    for (const habit of stepHabits) {
      if (completedSet.has(habit.id)) continue;
      if (completedRef.current.has(habit.id)) continue;
      if (currentSteps >= habit.target_value!) {
        completedRef.current.add(habit.id);
        await markHabitDone(habit.id, today);
        queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
        queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
      }
    }
  }, [stepHabits, completedSet, today, queryClient]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (stepHabits.length === 0) return;

    // Check immediately on mount (catches up after app was backgrounded/killed)
    checkAndComplete();

    // Poll every 30 seconds while app is open
    const interval = setInterval(checkAndComplete, POLL_INTERVAL_MS);

    // Also check when app returns to foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndComplete();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [checkAndComplete, stepHabits.length]);
}
```

**Division of responsibilities:**
- **Native service** → fires notification (works even when app is killed)
- **JS hook** → writes to Supabase `habit_logs` (runs when app is open, polls every 30s)
- If the user hit the goal while the app was killed, the notification already fired natively. When the app opens, this hook catches up and writes the log to the database.

### 5. Mount the hook

**Modify: `app/habits/index.tsx`**

Add at the top of `HabitsScreen`:

```ts
useStepHabitAutoComplete();
```

Also consider mounting it in `LayoutWrapper` or `_layout.tsx` so it runs even when the user isn't on the habits page. The polling interval (30s) is lightweight.

### 6. Update HabitChecklist and HabitRow

**Modify: `features/habits/components/HabitChecklist.tsx`**

Pass `currentSteps` to step habit rows so they can show progress.

**Modify: `features/habits/components/HabitRow.tsx`**

For step habits, replace the toggle with a progress bar:

```
Manual habit:
+------------------------------------------+
|  Read 30 min                      [ON]   |
+------------------------------------------+

Step habit (in progress):
+------------------------------------------+
|  5 000 steps                      [OFF]  |
|  [=========>-----------] 3 200 / 5 000   |
+------------------------------------------+

Step habit (auto-completed):
+------------------------------------------+
|  5 000 steps                      [ON]   |
|  [=========================] 5 200       |
+------------------------------------------+
```

Changes to `HabitRow`:
- Accept new props: `currentSteps?: number`
- If `habit.type === "steps"`:
  - Show a progress bar (`View` with percentage width + green background) below the name
  - Show step count text: `"3 200 / 5 000"`
  - Keep the Toggle component — user can manually toggle as a fallback
  - Auto-completion fills the toggle automatically, but user can override
- If `habit.type === "manual"`: keep current behavior (name + toggle)

### 7. Get current steps for the checklist

**Create: `features/habits/hooks/useTodaySteps.ts`**

Uses polling to fetch today's step count. The existing `addLiveStepListener` is session-only and cannot be used here (see section 4 for details).

```ts
import { useState, useEffect } from "react";
import { AppState } from "react-native";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import { Platform } from "react-native";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useTodaySteps() {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const fetchSteps = () => {
      getTodaySteps().then(setSteps);
    };

    fetchSteps();

    const interval = setInterval(fetchSteps, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchSteps();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return steps;
}
```

Use this in `HabitsScreen` and pass `currentSteps` down to `HabitChecklist` -> `HabitRow`.

### 8. Step habits on past dates

When viewing a past date in the calendar:
- Step habits show as completed (green) if a `habit_log` exists for that date
- Step habits show as not completed (empty) if no log exists
- No progress bar for past dates — just the binary done/not-done status (no step data available for past dates)
- Manual toggle works on past dates too — user can retroactively mark a step habit done if auto-completion missed it

### 9. Habit detail page

**Modify: `app/habits/[id]/index.tsx`**

For step habits:
- Show the target in the stats card: "Goal: 5,000 steps"
- Stats (streaks, completion rate) work identically — they're based on `habit_logs` which are the same for both types
- Edit button opens the create page with step form pre-filled
- No changes to MonthGrid — it already shows done/not-done per day

### 10. Full flow (app open, backgrounded, and killed)

**App is open:**
1. JS hook polls `getTodaySteps()` every 30 seconds
2. JS hook detects target reached → writes `habit_log` to Supabase
3. Native service also detects target → fires notification (user sees it if app is in background)

**App is backgrounded or killed:**
1. Native `StepTrackingService` (foreground service) keeps counting steps
2. Steps hit target → native service fires notification immediately
3. No database write yet (JS isn't running)
4. User opens app → JS hook calls `getTodaySteps()` → catches up → writes `habit_log` to Supabase

---

## Widget Integration

### Problem

The step widget (`StepsWidget`) already has its own `dailyGoal` setting stored in AsyncStorage (`StepsConfig`). If the user also creates a step habit, they'd have two separate goal configurations that don't know about each other.

### Solution

When step habits exist, the widget uses the **highest step habit target** as its goal. The manual goal setting in widget config is hidden/overridden.

### How it works

**Modify: `features/widgets/widget-storage.ts`**

Add a function that resolves the effective step goal:

```ts
export async function getEffectiveStepsConfig(): Promise<StepsConfig> {
  const config = await getGlobalStepsConfig();

  // Check if step habits exist — their targets override the manual goal
  const raw = await AsyncStorage.getItem("step_habit_targets");
  if (raw) {
    const targets: number[] = JSON.parse(raw);
    if (targets.length > 0) {
      const highestTarget = Math.max(...targets);
      return { showGoal: true, dailyGoal: highestTarget };
    }
  }

  return config;
}
```

**Modify: `useStepGoalSync` hook** — also write targets to AsyncStorage for the widget:

```ts
useEffect(() => {
  setStepGoals(
    stepTargets,
    t("stepGoalReached"),
    t("stepGoalBody", { steps: "{{steps}}" }),
  );

  // Also store in AsyncStorage for widget to read
  AsyncStorage.setItem("step_habit_targets", JSON.stringify(stepTargets));
}, [JSON.stringify(stepTargets), t]);
```

**Modify: Widget rendering** — use `getEffectiveStepsConfig()` instead of `getGlobalStepsConfig()` wherever the widget is rendered (widget task handler, screen unlock handler, etc.).

**Modify: `app/menu/widgets/steps.tsx`** — when step habits exist:
- Show the goal as read-only with a note: "Goal set by step habit (10,000 steps)"
- Hide the manual goal input
- Keep the "Show goal" toggle (user might want to hide the progress bar)

### What stays the same

- If the user has no step habits → widget config works exactly as before (manual `dailyGoal`)
- Widget appearance is unchanged — same progress bar, same colors
- The `StepsConfig` type doesn't change
- Deleting/archiving all step habits → widget falls back to the manual goal

---

## Translations

### `locales/en/habits.json` — add:

```json
"habitType": "Habit Type",
"typeManual": "Manual",
"typeSteps": "Steps",
"stepGoal": "Step Goal",
"stepGoalPlaceholder": "e.g. 5000",
"steps": "steps",
"stepHabitName": "{{steps}} steps",
"stepGoalReached": "Step goal reached!",
"stepGoalBody": "You hit {{steps}} steps today! Habit marked as done.",
"stepProgress": "{{current}} / {{target}}"
```

### `locales/fi/habits.json` — add:

```json
"habitType": "Tavan tyyppi",
"typeManual": "Manuaalinen",
"typeSteps": "Askeleet",
"stepGoal": "Askeltavoite",
"stepGoalPlaceholder": "esim. 5000",
"steps": "askelta",
"stepHabitName": "{{steps}} askelta",
"stepGoalReached": "Askeltavoite saavutettu!",
"stepGoalBody": "Saavutit {{steps}} askelta tänään! Tapa merkitty tehdyksi.",
"stepProgress": "{{current}} / {{target}}"
```

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDDHHmmss_step_habit.sql` | Create |
| `types/habit.ts` | Modify (add `type`, `target_value`) |
| `database/habits/save-habit.ts` | Modify (add `type`, `targetValue` params) |
| `database/habits/edit-habit.ts` | Modify (add `type`, `targetValue` params) |
| `app/habits/create.tsx` | Modify (add type selector, step goal input) |
| `app/habits/index.tsx` | Modify (mount auto-complete hook, pass steps to checklist) |
| `app/habits/[id]/index.tsx` | Modify (show step target in stats) |
| `features/habits/hooks/useStepHabitAutoComplete.ts` | Create |
| `features/habits/hooks/useTodaySteps.ts` | Create |
| `features/habits/hooks/useStepGoalSync.ts` | Create |
| `features/habits/components/HabitRow.tsx` | Modify (progress bar for step habits) |
| `features/habits/components/HabitChecklist.tsx` | Modify (pass currentSteps) |
| `native/android/NativeStepCounter.ts` | Modify (add `setStepGoals`) |
| `android/.../step/StepCounterModule.kt` | Modify (add `setStepGoals` method) |
| `android/.../step/StepTrackingService.kt` | Modify (add goal check + notification) |
| `features/widgets/widget-storage.ts` | Modify (add `getEffectiveStepsConfig`) |
| `app/menu/widgets/steps.tsx` | Modify (read-only goal when step habits exist) |
| `locales/en/habits.json` | Modify (add step translations) |
| `locales/fi/habits.json` | Modify (add step translations) |
| `locales/en/widgets.json` | Modify (add step habit goal note) |
| `locales/fi/widgets.json` | Modify (add step habit goal note) |

---

## Implementation Order

### Step 1: Database migration
- Add `type` and `target_value` columns to `habits`
- Add constraint for step habits requiring a target

### Step 2: Type and save updates
- Update `Habit` type
- Update `saveHabit` and `editHabit` database functions

### Step 3: Native goal check + notification
- Add `setStepGoals` to `StepCounterModule.kt` and `NativeStepCounter.ts`
- Add `checkStepGoals` and `fireGoalReachedNotification` to `StepTrackingService.kt`
- Create `useStepGoalSync` hook and mount in `_layout.tsx` or `LayoutWrapper`

### Step 4: Create/edit page
- Add habit type selector (Manual / Steps toggle)
- Add step goal numeric input
- Auto-generate name for step habits
- Hide reminder for step habits
- Call `setStepGoals` after save/edit/delete

### Step 5: Today's steps hook
- Create `useTodaySteps` hook
- Wire into HabitsScreen

### Step 6: HabitRow progress bar
- Render progress bar for step habits
- Show current/target text
- Keep toggle for manual fallback

### Step 7: Auto-completion (DB sync)
- Create `useStepHabitAutoComplete` hook
- Mount in HabitsScreen (and optionally in LayoutWrapper)
- Test: create 100-step habit, walk around, verify auto-completion + notification

### Step 8: Widget integration
- Add `getEffectiveStepsConfig` to widget-storage
- Update `useStepGoalSync` to write targets to AsyncStorage
- Update widget settings page (read-only goal when step habits exist)
- Update widget rendering to use `getEffectiveStepsConfig`

### Step 9: Translations
- Add all new translation keys in EN and FI

---

## Edge Cases

- **No step permission**: If the user hasn't granted step permission, step habits still appear but show 0 progress. The create page could warn or prompt for permission.
- **Multiple step habits with different targets**: Each tracked independently. Hitting 5,000 marks the 5,000 habit done but not the 10,000 habit.
- **Step counter resets at midnight**: Native module handles daily reset. The hook uses `getTodaySteps()` which returns today's count.
- **Editing a step habit target**: If the user changes 5,000 -> 8,000 and today's steps are 6,000, the completion is NOT reverted (existing log stays). The new target applies going forward.
- **iOS users**: Step habits don't auto-complete on iOS (no native step counter). The create page should hide the "Steps" type option on iOS entirely using `Platform.OS` check.
- **App not opened all day**: The native service still fires the goal notification. But the `habit_log` won't be written to Supabase until the app is opened (JS hook catches up on launch). If the user never opens the app, the log is missing — they can manually mark it done the next day via the calendar view.
- **Confetti**: Step habit auto-completion should trigger the "all habits done" confetti if it's the last remaining habit for the day.
- **Duplicate targets**: If two step habits have the same target (e.g., two "5,000 steps" habits), only one native notification fires (deduplicated by target value). Both habits are still independently marked done by the JS hook since it uses habit IDs, not targets.
- **Notification permission (Android 13+)**: The native notification requires `POST_NOTIFICATIONS` permission on Android 13+. The app likely already requests this for other notifications. If not, the goal notification silently fails — the DB auto-completion still works.

---

## Future Enhancements (not in scope)

- **Other auto-habits**: Same pattern could support "distance walked" or "calories burned" habits.
- **Frequency-aware native goals**: Currently the native service checks goals every day. It doesn't know about `frequency_days`. A step habit scheduled only for weekdays will still fire a notification on Saturday. This is acceptable for now — the JS hook won't write the log for non-scheduled days, so the habit won't actually be marked done.
