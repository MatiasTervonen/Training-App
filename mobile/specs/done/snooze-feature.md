# Snooze / Extend Feature for Reminders & Timers

## Context
Currently, when an alarm fires (reminder or timer), the user can only **stop** it (via notification action button or the fullscreen AlarmActivity "Stop" button). This plan adds:
- **Reminders**: a "Snooze (5 min)" button to defer the reminder
- **Timers**: a "+1 min" button to extend the timer

Both are available from the notification and the fullscreen AlarmActivity.

## Requirements
- **Reminders**: single "Snooze (5 min)" button — one tap, 5-minute delay
- **Timers**: single "+1 min" button — one tap, 1-minute extension
- **Both surfaces**: notification action button + fullscreen AlarmActivity button
- **Unlimited**: no cap on repeat snoozes/extensions

## How It Works
Snooze/extend = **stop the current alarm** + **schedule a new one-time alarm N minutes from now** using the existing `AlarmScheduler.schedule()`. The snoozed alarm reuses the same ID (`reminderId` or timer request code), so it flows through the same `AlarmReceiver → AlarmService → AlarmActivity` pipeline and any cancellation from JS still works.

| Alarm type | Button label | Duration | Notification label | Fullscreen label |
|------------|-------------|----------|--------------------|-----------------|
| Reminder | Snooze | 5 min | "Snooze (5 min)" | "Snooze (5 min)" |
| Timer | +1 min | 1 min | "+1 min" | "+1 min" |

---

## Files to Change

### 1. Localization (no dependencies)

**`mobile/locales/en/reminders.json`** — add inside `notification` object:
- `"snooze": "Snooze (5 min)"`

**`mobile/locales/fi/reminders.json`** — add inside `notification` object:
- `"snooze": "Torkku (5 min)"`

**`mobile/locales/en/gym.json`** (or wherever timer strings live) — add:
- `"extendTimer": "+1 min"`

**`mobile/locales/fi/gym.json`** — add:
- `"extendTimer": "+1 min"`

### 2. `AlarmScheduler.kt`
- Add `snoozeText: String = "Snooze"` parameter to `schedule()`, `scheduleRepeating()`, `scheduleInternal()`
- Add `putExtra("SNOOZE_TEXT", snoozeText)` to the intent in `scheduleInternal()`
- Add `snoozeText` to `RepeatInfo` data class, `saveRepeatInfo()`, `getRepeatInfo()`, `clearRepeatInfo()`

### 3. NEW: `SnoozeAlarmReceiver.kt`
- New `BroadcastReceiver` for notification snooze/extend action
- Reads alarm context from intent extras + `SNOOZE_DURATION_MINUTES` (default 5 for reminders, 1 for timers)
- Stops `AlarmService`, schedules new alarm via `AlarmScheduler.schedule()`

### 4. `AndroidManifest.xml`
- Register `<receiver android:name=".alarm.SnoozeAlarmReceiver" android:exported="false"/>` after `StopAlarmReceiver`

### 5. `AlarmReceiver.kt`
- Read `SNOOZE_TEXT` from intent extras
- Pass `SNOOZE_TEXT` to both `AlarmService` intent and `AlarmActivity` intent
- Pass `snoozeText` in `scheduleNextRepeat()` call

### 6. `AlarmService.kt`
- Add `snoozeText` instance variable, read from intent in `onStartCommand()`
- Pass `SNOOZE_TEXT` to `AlarmActivity` fullscreen intent
- In `buildNotification()`, add a second action button for **both reminders and timers**:
  - Reminder: `"Snooze (5 min)"` → `SnoozeAlarmReceiver` with `SNOOZE_DURATION_MINUTES=5`
  - Timer: `"+1 min"` → `SnoozeAlarmReceiver` with `SNOOZE_DURATION_MINUTES=1`
  - Use request code 3, pass all alarm context extras

### 7. `activity_alarm.xml`
- Add a single `snoozeButton` Button (visibility=gone) below the stop button
- Styled same as stop button but secondary style

### 8. `AlarmActivity.kt`
- Read `SNOOZE_TEXT`, `SOUND_TYPE` from intent extras
- For **reminders**: show snooze button with text "Snooze (5 min)", duration = 5
- For **timers**: show snooze button with text "+1 min", duration = 1
- New `snoozeAlarm(durationMinutes: Int)` method: stops AlarmService, emits STOP_ALARM_SOUND, schedules new alarm via `AlarmScheduler.schedule()`, calls `finish()` (does NOT open the app)

### 9. `AlarmModule.kt`
- Add `snoozeText: String` parameter to `scheduleAlarm()` bridge method

### 10. `NativeAlarm.ts`
- Add `snoozeText?: string` parameter to `scheduleNativeAlarm()`

### 11. JS call sites that schedule alarms (pass `snoozeText`)

**Reminder call sites:**
- `mobile/features/reminders/hooks/onetime/useSetNotification.ts`
- `mobile/features/reminders/hooks/global/useSetNotification.ts`
- `mobile/features/reminders/hooks/edit-reminder/useSetNotification.ts`
- `mobile/database/reminders/syncAlarms.ts`

**Timer call sites** (pass `"+1 min"` as snoozeText):
- `timerStore.ts`
- `timer.tsx`
- `empty-timer/index.tsx`

### 12. `BootReceiver.kt`
- Pass `snoozeText = repeatInfo.snoozeText` in the `scheduleRepeating()` call

---

## Verification
1. Build with `npx expo run:android`

### Reminder snooze
2. Create a one-time reminder in alarm mode, set to fire in 1 minute
3. When it fires:
   - **Notification**: verify two action buttons ("Stop Alarm" + "Snooze (5 min)")
   - Tap "Snooze (5 min)" → alarm stops, fires again 5 minutes later
4. When it fires again:
   - **AlarmActivity**: verify single "Snooze (5 min)" button below the stop button
   - Tap it → alarm stops, activity closes (no app navigation), fires again 5 minutes later
5. Verify repeating daily/weekly reminders still work after snooze changes

### Timer +1 min
6. Start a timer, let it fire
7. When it fires:
   - **Notification**: verify two action buttons ("Stop Alarm" + "+1 min")
   - Tap "+1 min" → alarm stops, fires again 1 minute later
8. When it fires again:
   - **AlarmActivity**: verify single "+1 min" button below the stop button
   - Tap it → alarm stops, activity closes, fires again 1 minute later
