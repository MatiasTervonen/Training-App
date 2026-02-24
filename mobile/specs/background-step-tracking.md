# Background Step Tracking — Reliable Steps Without Active Session

## Problem

Steps only update when the app is opened and `startPassiveTracking()` runs from `_layout.tsx`. When the app is killed or in the background, no sensor readings happen. This causes:

1. **Widget shows stale data** — only updates on app open or device unlock (via `StepWidgetUpdateReceiver`), but unlock only works if the sensor has been read recently
2. **Analytics page shows incomplete data** — today's steps are only as fresh as the last sensor reading
3. **WorkManager (15-min periodic)** runs `readSensorValueSync()` which registers a quick one-shot listener, but WorkManager is throttled by Android (can be delayed 30+ min in Doze mode) and has a minimum interval of 15 minutes
4. **No boot-time restart** — the BootReceiver only reschedules alarms, not the step counter WorkManager

### Root Cause

The `passiveTracking` sensor listener lives inside `StepCounterModule` (a React Native native module). When the React Native app process dies, the listener dies with it. WorkManager survives, but its 15-minute intervals with sync `readSensorValueSync()` create large gaps where steps are lost.

---

## How Other Apps Solve This

Apps like Google Fit, Samsung Health, Strava, and Fitbit use a **persistent Foreground Service** for real-time step tracking. This is the standard approach on Android.

### Why a Foreground Service

| Approach | Reliability | Battery | Steps Accuracy |
|---|---|---|---|
| **Sensor listener in-app only** (current) | Low — dies with app | None | Misses all background steps |
| **WorkManager every 15 min** (current) | Medium — Doze delays it | Low | Loses steps between readings due to sensor value resets |
| **Foreground Service + TYPE_STEP_COUNTER** | High — survives Doze | Very low (step counter is hardware-backed, near-zero drain) | Catches every step |
| Google Health Connect API | High | Very low | Requires user to install & authorize Health Connect |

**The Foreground Service approach is correct** for our use case because:
- `TYPE_STEP_COUNTER` is a hardware-backed batching sensor — it uses nearly zero battery
- A foreground service with `SENSOR_DELAY_NORMAL` and batching is what Google Fit does internally
- Android requires a visible notification for foreground services, but step-tracker notifications are expected by users (Google Fit, Samsung Health all show them)
- The service survives app kills, Doze mode, and App Standby

---

## Implementation Plan

### Phase 1: Foreground Service for Step Tracking

#### 1.1 Create `StepTrackingService.kt`

New file: `android/app/src/main/java/com/layer100crypto/MyTrack/step/StepTrackingService.kt`

```
ForegroundService that:
- Registers TYPE_STEP_COUNTER sensor listener on start
- On each sensor event: calls StepCounterHelper.recordReadingWithValue()
- Shows a persistent notification ("Tracking steps: 4,231 today")
- Updates notification every ~60 seconds with current day's total
- Runs with foregroundServiceType="specialUse" (already approved for the alarm service)
- Handles reboot detection (sensor value resets to 0)
```

Key design decisions:
- **Use `SensorManager.SENSOR_DELAY_NORMAL`** with `maxReportLatencyUs = 60_000_000` (60 seconds). This tells Android to batch sensor events and deliver them every ~60 seconds instead of per-step. This is the battery-optimal approach used by Google Fit.
- **Notification channel**: Create a low-importance channel (`IMPORTANCE_LOW`) so it doesn't make sound. Users can further minimize it in system settings.
- **Wake lock**: Not needed — `TYPE_STEP_COUNTER` is a wake-up sensor and will wake the CPU when it delivers batched events.

#### 1.2 Update `AndroidManifest.xml`

```xml
<!-- Add missing permission -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION"/>

<!-- Service declaration (reuses SPECIAL_USE type, already approved for alarm service) -->
<service
    android:name=".step.StepTrackingService"
    android:exported="false"
    android:foregroundServiceType="specialUse">
</service>
```

> **Bug found**: `ACTIVITY_RECOGNITION` permission is never declared in the manifest! The code checks/requests it, but it's never actually declared. This should be added regardless.

#### 1.3 Update `StepCounterModule.kt`

Add new React methods:
- `startStepTrackingService()` — starts the foreground service
- `stopStepTrackingService()` — stops the foreground service
- `isStepTrackingServiceRunning()` — checks if the service is active

Remove passive tracking code that the foreground service replaces:
- Delete `startPassiveTracking()`, `stopPassiveTracking()`, `stopPassiveTrackingInternal()` methods
- Delete the `passiveSensorManager` and `passiveListener` instance variables

#### 1.4 Update `NativeStepCounter.ts`

Add TypeScript wrappers:
- `startStepTrackingService()`
- `stopStepTrackingService()`
- `isStepTrackingServiceRunning()`

### Phase 2: Auto-Start and Lifecycle

#### 2.1 Start Service on App Launch

In `_layout.tsx`, replace `startPassiveTracking()` with `startStepTrackingService()`. The service will continue running even after the app is closed.

#### 2.2 Start Service on Boot

Update `BootReceiver` (already registered for `BOOT_COMPLETED`) to also start the step tracking service. This ensures steps are tracked from the moment the device boots, not just when the user opens the app.

### Phase 3: Widget Updates

#### 3.1 Fix Widget Update Bug

**Bug**: `StepWidgetUpdateReceiver.triggerWidgetUpdate()` looks for `$packageName.StepsWidgetProvider` but the actual widget class is `$packageName.widget.Steps`. This means `triggerWidgetUpdate()` is silently failing every time. Fix:

```kotlin
// Change from:
val providerClassName = "$packageName.StepsWidgetProvider"
// To:
val providerClassName = "$packageName.widget.Steps"
```

#### 3.2 Keep Existing Widget Update Triggers

Keep all existing triggers as they are (they're good supplementary paths):
- Device unlock → `StepWidgetUpdateReceiver`
- App foreground → `onAppStateChange` in `_layout.tsx`

### Phase 4: Analytics Freshness

#### 4.1 No Code Changes Needed for Analytics

Once the foreground service is running, `StepCounterHelper`'s SharedPreferences will always have fresh step data. The analytics page already calls `getTodaySteps()` which reads from SharedPreferences — so it will automatically show up-to-date numbers.

#### 4.2 Improve Backfill Sync

Currently `backfillMissingDaysThrottled()` only runs once per day. Consider also syncing today's steps to Supabase when the app comes to foreground, so the web dashboard stays fresh. This is optional but nice to have.

### Phase 5: Remove Redundant Code

The foreground service fully replaces the old passive tracking approach. Remove all redundant code to keep the codebase clean.

#### 5.1 `StepCounterModule.kt`

- Delete `startPassiveTracking()` method
- Delete `stopPassiveTracking()` method
- Delete `stopPassiveTrackingInternal()` method
- Delete `passiveSensorManager` and `passiveListener` instance variables
- Remove the `@ReactMethod` exports for the above

#### 5.2 `NativeStepCounter.ts`

- Delete `startPassiveTracking()` wrapper function
- Delete `stopPassiveTracking()` wrapper function

#### 5.3 `_layout.tsx`

- Remove the `startPassiveTracking()` call (replaced by `startStepTrackingService()` in Phase 2.1)

#### 5.4 `StepCounterWorker.kt`

- **Delete the entire file** — the foreground service + BootReceiver fully replace WorkManager's role

#### 5.5 `StepCounterModule.kt` — Remove WorkManager setup

- Remove `initializeStepCounter()` or strip out the WorkManager scheduling code from it
- Remove any WorkManager imports

#### 5.6 Keep (DO NOT remove)

These are still needed:
- `readSensorValueSync()` in `StepCounterHelper` — used by `startSession()` to capture the baseline when starting an activity
- All session tracking methods (`startSession()`, `getSessionSteps()`, `startLiveStepUpdates()`)

---

## File Changes Summary

| File | Change |
|---|---|
| **NEW** `step/StepTrackingService.kt` | Foreground service with step sensor listener |
| `AndroidManifest.xml` | Add `ACTIVITY_RECOGNITION` permission, service declaration with `specialUse` type |
| `step/StepCounterModule.kt` | Add service methods, **delete** passive tracking methods and variables |
| `step/StepCounterWorker.kt` | **Delete entirely** — no longer needed |
| `step/StepWidgetUpdateReceiver.kt` | Fix widget class name bug (`widget.Steps`) |
| `alarm/BootReceiver.kt` | Add step service start on boot |
| `native/android/NativeStepCounter.ts` | Add service wrappers, **delete** passive tracking wrappers |
| `app/_layout.tsx` | **Replace** `startPassiveTracking()` with `startStepTrackingService()` |

---

## Battery Impact

Negligible. `TYPE_STEP_COUNTER` is a hardware-backed sensor that runs on a low-power co-processor (like the BMI160 or LSM6DSO chip). Google's own documentation states:

> "The step counter sensor has very low power consumption... apps can use this sensor without significant battery drain."

With 60-second batching, the main CPU wakes up roughly once per minute to process a batch — this is the same approach Google Fit uses.

The foreground notification is the only visible impact, and users expect it from a step-tracking app.

---

## User-Facing Changes

1. **Persistent notification**: "MyTrack — Tracking steps: X,XXX today" (low importance, no sound)
2. **Widget always up to date**: Updates on device unlock and app foreground
3. **Analytics always accurate**: Steps counted 24/7, not just when app is open
4. **Steps counted from boot**: No need to open app first after restarting phone

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| User disables notification → service gets killed | Service restarts on next app open or device reboot (via BootReceiver). Educate user in onboarding. |
| Battery optimization kills service (OEM-specific: Xiaomi, Samsung, etc.) | Request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (already in manifest). Guide user to whitelist app. |
| Android 14+ restricts foreground service starts from background | Start from boot receiver (allowed) and user-initiated app open (allowed). |
| Play Store policy changes for `SPECIAL_USE` type | Already approved for alarm service. If Google flags it, apply for `FOREGROUND_SERVICE_HEALTH` at that point. |
