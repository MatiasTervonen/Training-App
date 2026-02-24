# Activity Session: Stationary Detection & Step Filtering Analysis

## Current State: Two Completely Separate Systems

The app currently has **two independent systems** that both detect whether the user is moving, but they don't talk to each other:

| System | Where | How | Used For |
|--------|-------|-----|----------|
| GPS Stationary Detection | `stationaryDetection.ts` (JS) | GPS coordinates + haversine distance + speed | Distance, moving time, pace, map, calories |
| Activity Recognition Filter | `StepTrackingService.kt` (Kotlin) | Google Activity Recognition API | Background step counting |

---

## How GPS Stationary Detection Works Today

During a live activity session with GPS enabled, every 300ms the app:

1. Gets a GPS location from `expo-location`
2. Passes it to `detectMovement()` which checks:
   - Is the point > 5 meters from the anchor?
   - Is the speed > 0.5 m/s (~1.8 km/h)?
   - Is GPS accuracy acceptable (< 25m)?
3. Uses a confidence system (0-5) that requires 3 consecutive moving readings
4. Points are classified as `isStationary: true/false`

**Stationary points are then excluded from:**
- Distance calculation (skip stationary-to-stationary pairs)
- Moving time calculation (skip stationary-to-stationary time)
- Map rendering (filter out stationary points before drawing)
- Calorie calculation (uses moving time, not total time)

---

## Should We Replace GPS Detection with Activity Recognition?

### No. Keep GPS detection for GPS metrics.

**Why:**

1. **GPS detection is doing a different job.** It's classifying individual GPS *points* as moving/stationary to calculate distance, pace, and draw map tracks. Activity Recognition cannot do this — it doesn't know coordinates.

2. **GPS detection is more precise for its purpose.** It catches GPS drift (phone sitting on a table but GPS coordinates wandering). Activity Recognition would say STILL but GPS detection also needs to identify *which specific points* are drift vs real movement.

3. **Activity Recognition is too slow for GPS tracking.** It updates every ~3 seconds. GPS updates every 300ms in foreground. You can't wait 3 seconds to classify each GPS point.

4. **GPS detection works without Google Play Services.** Some phones (Huawei, custom ROMs) don't have Play Services. GPS detection is self-contained.

---

## Should We Filter Steps During Live Sessions?

### Yes — but with a key distinction.

Currently live session steps (`startLiveStepUpdates()` in `StepCounterModule.kt`) are completely unfiltered. The assumption was "user started a workout, so they're moving." But this isn't always true:

**Real scenarios where filtering matters during sessions:**
- User starts a "Walking" activity, walks to a coffee shop, sits down for 20 minutes scrolling their phone, then walks back
- User pauses at a traffic light for 2 minutes
- User sits on a bench mid-run to rest

During these pauses, fake steps from hand movements still accumulate in the live step count.

**But there are two separate step paths during a session:**

### Path 1: Background daily steps (StepTrackingService) — Already filtered
The foreground service runs continuously. Its `onSensorChanged()` already checks `shouldCountStep()` via Activity Recognition. So `getTodaySteps()` is already filtered even during a session.

### Path 2: Live session steps (StepCounterModule) — NOT filtered
`startLiveStepUpdates()` registers its own sensor listener that emits `LIVE_STEP_UPDATE` events directly. It computes `currentValue - sessionStartValue` and sends it straight to React Native. **No Activity Recognition check happens here.**

This means:
- The notification shows filtered daily steps (correct)
- The widget shows filtered daily steps (correct)
- The live activity UI shows **unfiltered** session steps (fake steps included)
- When the activity is saved, the daily step total is correct, but the session step count may be inflated

---

## Recommendation: Add Filter to Live Session Steps

### What to change

Modify `StepCounterModule.kt`'s `startLiveStepUpdates()` to also check Activity Recognition state before emitting live step events.

### Implementation

In `StepCounterModule.kt`, the live step listener (around line 267-282) currently does:

```kotlin
// Current (unfiltered):
override fun onSensorChanged(event: SensorEvent) {
    val currentValue = event.values[0].toLong()
    val sessionStart = prefs.getLong("session_start_value", -1L)
    if (sessionStart == -1L) return
    val sessionSteps = if (currentValue < sessionStart) currentValue else currentValue - sessionStart
    // Emit to React Native
    sendEvent("LIVE_STEP_UPDATE", sessionSteps)
}
```

Change to:

```kotlin
// New (filtered):
override fun onSensorChanged(event: SensorEvent) {
    val currentValue = event.values[0].toLong()
    val sessionStart = prefs.getLong("session_start_value", -1L)
    if (sessionStart == -1L) return

    // Check Activity Recognition state
    val activityType = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_TYPE, DetectedActivity.UNKNOWN)
    val activityConfidence = prefs.getInt(StepCounterHelper.KEY_CURRENT_ACTIVITY_CONFIDENCE, 0)
    val lastWalkingTime = prefs.getLong(StepCounterHelper.KEY_LAST_WALKING_TIMESTAMP, 0L)

    val isMoving = activityType in listOf(
        DetectedActivity.WALKING, DetectedActivity.RUNNING, DetectedActivity.ON_FOOT
    ) && activityConfidence >= 70
    val gracePeriodActive = System.currentTimeMillis() - lastWalkingTime < 5000L
    val shouldCount = isMoving || gracePeriodActive || activityType == DetectedActivity.UNKNOWN

    if (!shouldCount) {
        // Update session start to skip filtered steps (same principle as updateLastSensorValue)
        filteredStepsCount += (delta that would have been counted)
        return
    }

    val sessionSteps = if (currentValue < sessionStart) currentValue else currentValue - sessionStart
    val adjustedSteps = sessionSteps - filteredStepsCount
    sendEvent("LIVE_STEP_UPDATE", adjustedSteps)
}
```

### The tricky part: session step math

The session step counter works by subtracting `sessionStartValue` from `currentSensorValue`. If we skip some steps in the middle, the math breaks:

```
Session start: sensor = 1000
Walk 50 steps: sensor = 1050, session = 50 ✅
Sit and fake 20 steps: sensor = 1070, session = 70 ❌ (should still be 50)
Walk 30 more: sensor = 1100, session = 100 ❌ (should be 80)
```

**Solution: Track filtered steps offset**

Add a counter `filteredStepsDuringSession` that accumulates the deltas we skip. Then:

```
sessionSteps = (currentSensorValue - sessionStartValue) - filteredStepsDuringSession
```

```
Session start: sensor = 1000, filtered = 0
Walk 50: sensor = 1050, filtered = 0, display = 1050 - 1000 - 0 = 50 ✅
Sit +20: sensor = 1070, filtered = 20, display = 1070 - 1000 - 20 = 50 ✅
Walk +30: sensor = 1100, filtered = 20, display = 1100 - 1000 - 20 = 80 ✅
```

---

## Implementation Plan

### File: `StepCounterModule.kt`

1. Add a class-level variable `filteredStepsDuringSession: Long = 0`
2. Add a variable `lastLiveSensorValue: Long = -1L` to track the previous sensor value for delta calculation
3. In `startSession()`: reset both to 0 / -1L
4. In the live step listener's `onSensorChanged()`:
   - Calculate delta from `lastLiveSensorValue`
   - Check Activity Recognition state (same logic as `StepTrackingService.shouldCountStep()`)
   - If NOT moving: add delta to `filteredStepsDuringSession`, update `lastLiveSensorValue`, return without emitting
   - If moving: compute `(currentValue - sessionStart) - filteredStepsDuringSession`, emit as `LIVE_STEP_UPDATE`, update `lastLiveSensorValue`
5. In `stopLiveStepUpdates()`: reset the counters

### File: `StepCounterHelper.kt`

6. Add a `getSessionStepsFiltered()` method that also subtracts the filtered count. This is used by `getSessionSteps()` when called from React Native (e.g., on foreground resume via `useStepHydration`).
   - Store `filteredStepsDuringSession` in SharedPreferences so it survives process death
   - Key: `session_filtered_steps`

### No JS/TS changes needed

The React Native side just receives `LIVE_STEP_UPDATE` events and `getSessionSteps()` results — both will now return filtered values. No TypeScript code needs to change.

---

## What NOT to Change

- **GPS stationary detection** — keep it exactly as is. It serves a different purpose (GPS point classification for distance/pace/map).
- **`StepTrackingService.onSensorChanged()`** — already filtered, no changes.
- **`StepCounterHelper.recordReadingWithValue()`** — already filtered via the service, no changes.
- **The 300ms GPS location watch** — Activity Recognition is too slow to replace this.
- **Background location task** — uses GPS-based detection, works fine.

---

## Summary

| What | Change? | Why |
|------|---------|-----|
| GPS stationary detection | No change | Different purpose (coordinates), more precise for GPS, faster updates |
| Replace GPS with Activity Recognition | No | AR can't classify GPS points, too slow (3s vs 300ms), no coordinates |
| Background step counting | Already filtered | `StepTrackingService.shouldCountStep()` already uses AR |
| Live session step counting | **Add filter** | Currently unfiltered, fake steps accumulate during rest periods |
| Daily steps / notification / widget | Already filtered | All read from the same filtered SharedPreferences data |

**One file to change:** `StepCounterModule.kt` — add Activity Recognition check to the live step listener and track a filtered steps offset for correct session math.
