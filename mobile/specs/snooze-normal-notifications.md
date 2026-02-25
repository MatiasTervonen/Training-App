## Context
Two problems:
1. **Normal-mode reminders** have no snooze button — the snooze only exists in native Kotlin `AlarmService` for alarm-mode
2. **Global reminder snooze** (both modes) doesn't update the database — so web and other devices don't get re-notified

This plan fixes both: adds snooze to normal-mode Expo notifications, and makes snoozing any global reminder (normal or alarm mode) update the DB so the cron job re-delivers to all devices.

---

## Part A: Snooze for Normal-Mode Notifications (Expo)

### 1. NEW: `mobile/features/push-notifications/constants.ts`
Shared constants:
- `SNOOZE_CATEGORY_ID = "reminder-snooze"`
- `SNOOZE_ACTION_ID = "snooze-5min"`
- `SNOOZE_DELAY_MS = 5 * 60 * 1000` (5 minutes)

### 2. `mobile/features/push-notifications/actions.ts`
Add `configureNotificationCategories()`:
```ts
export async function configureNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(SNOOZE_CATEGORY_ID, [
    {
      identifier: SNOOZE_ACTION_ID,
      buttonTitle: t("reminders:reminders.notification.snooze"),
      options: { opensAppToForeground: false },
    },
  ]);
}
```

### 3. `mobile/app/_layout.tsx` (line 147)
Call `configureNotificationCategories()` in the existing useEffect alongside channel/handler setup.

### 4. `mobile/features/feed/hooks/useNotificationResponse.ts`
Replace empty callback with snooze handler:
- Check `actionIdentifier === SNOOZE_ACTION_ID`
- Dismiss current notification
- Schedule new one-time Expo notification 5 min later (same title, body, data, `categoryIdentifier` for chaining)
- **If `data.type === "global-reminder"`**: update DB (see Part C below)

### 5. Add `categoryIdentifier` to normal-mode notification scheduling

**Hooks where both modes reach `scheduleNotificationAsync`** (add conditionally):
| File | Calls | Pattern |
|------|-------|---------|
| `mobile/features/reminders/hooks/onetime/useSetNotification.ts` | 1 (line 37) | `...(mode === "normal" && { categoryIdentifier: SNOOZE_CATEGORY_ID })` |
| `mobile/features/reminders/hooks/global/useSetNotification.ts` | 1 (line 37) | Same |
| `mobile/features/reminders/hooks/edit-reminder/useSetNotification.ts` | 3 (lines 57, 88, 121) | Same |

**Hooks where alarm branch returns early** (add unconditionally):
| File | Calls |
|------|-------|
| `mobile/features/reminders/hooks/daily/useSetNotification.ts` | 1 (line 65) |
| `mobile/features/reminders/hooks/weekly/useSetNotification.ts` | 1 (line 89) |

**Sync helpers** (add optional `mode` param, conditionally add `categoryIdentifier`):
| File | Change |
|------|--------|
| `mobile/features/reminders/setNotificationsForSync/setOneTime.ts` | Add `mode?: "alarm" \| "normal"` param |
| `mobile/features/reminders/setNotificationsForSync/setDaily.ts` | Same |
| `mobile/features/reminders/setNotificationsForSync/setWeekly.ts` | Same |

### 6. `mobile/database/reminders/syncNotifications.ts`
Pass `mode: reminder.mode` to each sync helper call (lines 55, 69, 90, 116). Default to `"normal"` if missing.

---

## Part B: Global Reminder DB Sync for Alarm-Mode Snooze (Native Kotlin)

When a global reminder in **alarm mode** is snoozed (via notification or fullscreen), the Kotlin code needs to notify JS so the app can update the database.

### Approach: use `"global-reminder"` as `soundType`

The `soundType` parameter (`"reminder"` or `"timer"`) already flows through the entire native alarm chain. For global reminders, pass `"global-reminder"` instead of `"reminder"`. This way Kotlin knows it's a global reminder without any new parameters.

**JS call site** (1 change):

| File | Change |
|------|--------|
| `mobile/features/reminders/hooks/global/useSetNotification.ts` | Change `soundType` from `"reminder"` to `"global-reminder"` in `scheduleNativeAlarm()` call |
| `mobile/database/reminders/syncAlarms.ts` | Use `"global-reminder"` for global alarms in the sync loop |

**Kotlin — treat `"global-reminder"` same as `"reminder"` for alarm behavior:**

| File | Change |
|------|--------|
| `mobile/android/.../alarm/SnoozeAlarmReceiver.kt` | Handle `"global-reminder"` same as `"reminder"` for snooze duration (5 min). If `soundType == "global-reminder"`, also call `ReactEventEmitter.sendGlobalReminderSnoozed()` |
| `mobile/android/.../alarm/AlarmActivity.kt` | Handle `"global-reminder"` same as `"reminder"` for UI/behavior. If `soundType == "global-reminder"`, also call `ReactEventEmitter.sendGlobalReminderSnoozed()` in `snoozeAlarm()` |
| `mobile/android/.../ReactEventEmitter.kt` | Add `sendGlobalReminderSnoozed(context, reminderId, snoozeDurationMinutes)` emitting `GLOBAL_REMINDER_SNOOZED` event |

**Other Kotlin files that check `soundType`** — ensure `"global-reminder"` is treated like `"reminder"`:

| File | What to check |
|------|--------------|
| `mobile/android/.../alarm/AlarmReceiver.kt` | Any `soundType` checks for sound selection or navigation |
| `mobile/android/.../alarm/AlarmService.kt` | Sound selection, notification label logic |
| `mobile/android/.../alarm/AlarmActivity.kt` | Button labels, navigation on stop |

In each case, where it checks `soundType == "reminder"`, change to `soundType == "reminder" || soundType == "global-reminder"`.

No changes to AlarmModule, AlarmScheduler, BootReceiver, or NativeAlarm.ts (they just pass the string through without checking it).

---

## Part C: JS Listener for Global Reminder DB Update

### NEW: `mobile/features/layout/GlobalReminderSnoozedListener.tsx`
Listen for `GLOBAL_REMINDER_SNOOZED` event from native Kotlin (alarm-mode snooze of a global reminder):
- On event: update `global_reminders` row by `reminderId`:
  ```ts
  await supabase.from("global_reminders")
    .update({ notify_at: new Date(now + snoozeDurationMs), delivered: false })
    .eq("id", reminderId);
  ```
- Cron job picks up the updated row → re-delivers to web/other devices

### `mobile/app/_layout.tsx`
Import and render `<GlobalReminderSnoozedListener />` alongside existing `<TimerFinishListener />` and `<AlarmPlayingListener />`.

### `mobile/features/feed/hooks/useNotificationResponse.ts`
For normal-mode snooze when `data.type === "global-reminder"`:
- Same DB update: `supabase.from("global_reminders").update({ notify_at: new Date(now + 5min), delivered: false }).eq("id", reminderId)`

---

## How It Works

### Normal-mode snooze flow
1. **App init**: `configureNotificationCategories()` registers `"reminder-snooze"` category
2. **Scheduling**: Normal-mode notifications include `categoryIdentifier` → OS shows "Snooze (5 min)" button
3. **Tap snooze**: JS handler dismisses notification, schedules new one 5 min later
4. **Global reminders**: Also updates DB → cron re-delivers to web/other devices

### Alarm-mode snooze flow (global reminders)
1. **Scheduling**: Global reminder hook passes `soundType: "global-reminder"` (instead of `"reminder"`) → flows through entire chain unchanged
2. **Tap snooze** (notification or fullscreen): Kotlin sees `soundType == "global-reminder"` → reschedules alarm + emits `GLOBAL_REMINDER_SNOOZED` with `reminderId`
3. **JS listener**: Updates `global_reminders` DB row → cron re-delivers to web/other devices

### Snooze chaining
All snoozed notifications (normal and alarm) carry the same category/flag, so users can snooze indefinitely.

---

## Verification
1. Build with `npx expo run:android`

### Local reminder snooze (normal mode)
2. Create a one-time reminder in **normal** mode, fire in 1 minute
3. Verify "Snooze (5 min)" action button on notification
4. Tap snooze → fires again 5 min later with snooze button (chaining works)
5. Test daily/weekly in normal mode also show snooze

### Global reminder snooze (normal mode)
6. Create a global reminder in **normal** mode, fire in 1 minute
7. Tap snooze on mobile → verify DB updated (`notify_at`, `delivered = false`)
8. Verify cron re-delivers to web ~5 min later

### Global reminder snooze (alarm mode)
9. Create a global reminder in **alarm** mode, fire in 1 minute
10. Snooze via notification action → verify DB updated
11. Snooze via fullscreen AlarmActivity button → verify DB updated
12. Verify web gets re-notified

### Alarm-mode regression
13. Create a local one-time reminder in **alarm** mode
14. Verify native alarm with full-screen + "Stop" + "Snooze" still works
15. Verify timer snooze (+1 min) still works unchanged
