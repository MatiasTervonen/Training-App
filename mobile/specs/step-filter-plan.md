# Step Counter Filter: Activity Recognition Implementation Plan

## Why We Need This

The current step counter uses `Sensor.TYPE_STEP_COUNTER` via a foreground service (`StepTrackingService`) that runs 24/7. The hardware sensor counts **all** detected steps with no filtering — it cannot distinguish real walking from repetitive hand movements while sitting (scrolling, gesturing, etc.). Over a full day of desk work, this can add hundreds of fake steps.

Google's Activity Recognition API solves this by classifying the user's current activity (WALKING, STILL, IN_VEHICLE, etc.). We use it as a **gate** — only accept steps when the user is actually moving.

---

## Current Architecture (No Filter)

```
TYPE_STEP_COUNTER sensor
        |
        v
StepTrackingService.onSensorChanged()
        |
        v
StepCounterHelper.recordReadingWithValue(currentValue)
        |
        v
delta = currentValue - lastSensorValue → add to daily_steps
```

**All sensor-reported steps are accepted unconditionally.**

---

## Target Architecture (With Filter)

```
TYPE_STEP_COUNTER sensor          Activity Recognition API
        |                                    |
        v                                    v
StepTrackingService.onSensorChanged()   ActivityRecognitionReceiver
        |                                    |
        v                                    v
        +--- Is user WALKING/RUNNING/ON_FOOT (confidence >= 70)?
        |
    YES |         NO
        v          v
  Count step    Ignore step
```

---

## Implementation Steps

### Step 1: Add Google Play Services Dependency

**File:** `mobile/android/app/build.gradle`

Add to dependencies:
```gradle
implementation 'com.google.android.gms:play-services-location:21.0.1'
```

This includes the Activity Recognition API. No new library downloads needed — most devices already have Google Play Services.

---

### Step 2: Add Permission to AndroidManifest.xml

**File:** `mobile/android/app/src/main/AndroidManifest.xml`

Add:
```xml
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
```

Note: `android.permission.ACTIVITY_RECOGNITION` is already declared in the manifest. The GMS permission is the legacy version needed for older Play Services.

Also register the new BroadcastReceiver (see Step 3):
```xml
<receiver
    android:name=".step.ActivityRecognitionReceiver"
    android:exported="false" />
```

---

### Step 3: Create ActivityRecognitionReceiver.kt

**New file:** `mobile/android/app/src/main/java/com/layer100crypto/MyTrack/step/ActivityRecognitionReceiver.kt`

A `BroadcastReceiver` that:
- Receives `PendingIntent` callbacks from the Activity Recognition API
- Extracts `ActivityRecognitionResult` from the intent
- Stores the most-probable activity type and confidence in `SharedPreferences` (`step_counter_prefs`)
- Keys: `current_activity_type` (Int) and `current_activity_confidence` (Int)

This is a simple, stateless receiver — it just writes the latest activity to SharedPreferences on each update.

---

### Step 4: Modify StepTrackingService.kt

**File:** `mobile/android/app/src/main/java/com/layer100crypto/MyTrack/step/StepTrackingService.kt`

Changes:

#### 4a: Start Activity Recognition when sensor is registered

In `onStartCommand()` after registering the sensor listener, add:
- Create `ActivityRecognitionClient` instance
- Create a `PendingIntent` pointing to `ActivityRecognitionReceiver`
- Call `requestActivityUpdates(detectionIntervalMs = 3000, pendingIntent)`
- Detection interval of 3 seconds provides responsive activity detection without excessive battery use

#### 4b: Stop Activity Recognition in onDestroy()

- Call `removeActivityUpdates(pendingIntent)` to clean up

#### 4c: Add activity check in onSensorChanged()

In `onSensorChanged()`, before calling `helper.recordReadingWithValue()`:

```kotlin
// Read current activity from SharedPreferences
val prefs = getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
val activityType = prefs.getInt("current_activity_type", DetectedActivity.UNKNOWN)
val activityConfidence = prefs.getInt("current_activity_confidence", 0)

val isMoving = activityType in listOf(
    DetectedActivity.WALKING,
    DetectedActivity.RUNNING,
    DetectedActivity.ON_FOOT
) && activityConfidence >= 70

if (isMoving) {
    helper.recordReadingWithValue(currentValue)
} else {
    // Still update last_sensor_value to prevent delta accumulation
    helper.updateLastSensorValue(currentValue)
}
```

**Critical:** When ignoring steps, we must still update `last_sensor_value`. Otherwise, if the user sits for an hour and the sensor accumulates 0 real steps but the counter advances by 500 (from hand movements), when they start walking again the delta would be huge and all "ignored" steps would flood in at once.

---

### Step 5: Add updateLastSensorValue() to StepCounterHelper.kt

**File:** `mobile/android/app/src/main/java/com/layer100crypto/MyTrack/step/StepCounterHelper.kt`

Add a new method:
```kotlin
fun updateLastSensorValue(currentValue: Long) {
    prefs.edit()
        .putLong("last_sensor_value", currentValue)
        .putLong("last_read_time", System.currentTimeMillis())
        .apply()
}
```

This is called when steps are filtered out — keeps the baseline in sync without adding to daily counts.

---

### Step 6: Handle the UNKNOWN/Initial State

When the app first starts or Activity Recognition hasn't delivered a result yet, `current_activity_type` defaults to `UNKNOWN`.

**Decision:** Accept steps when activity is UNKNOWN (fail-open). This prevents losing real steps during the first few seconds after service start. Once Activity Recognition delivers its first result (within ~3 seconds), filtering kicks in.

Also accept steps when `current_activity_type` is `ON_BICYCLE` — cycling can legitimately produce step-like motion and users may want those counted.

---

### Step 7: Grace Period for Activity Transitions

Add a transition buffer to avoid cutting off steps at activity boundaries:

- **STILL → WALKING transition:** Accept steps immediately (no delay needed — Activity Recognition already has ~3s latency)
- **WALKING → STILL transition:** Continue accepting steps for 5 seconds after the last WALKING detection. This captures the final few steps as someone stops walking.

Implementation: Store `last_walking_timestamp` in SharedPreferences from `ActivityRecognitionReceiver`. In the step filter check:

```kotlin
val lastWalkingTime = prefs.getLong("last_walking_timestamp", 0L)
val gracePeriodActive = System.currentTimeMillis() - lastWalkingTime < 5000

val shouldCountStep = isMoving || gracePeriodActive || activityType == DetectedActivity.UNKNOWN
```

---

### Step 8: Update BootReceiver.kt (No Changes Needed)

The `BootReceiver` already starts `StepTrackingService`, which will now automatically start Activity Recognition as part of its startup. No changes needed here.

---

### Step 9: Live Step Updates During Sessions

**File:** `mobile/android/app/src/main/java/com/layer100crypto/MyTrack/step/StepCounterModule.kt`

The `startLiveStepUpdates()` listener in `StepCounterModule` is used during active workout sessions. During workouts, the user is definitionally moving, so:

**No filtering needed for live session steps.** The user explicitly started a walking/running activity — we trust all sensor data during sessions.

---

## Files Changed Summary

| File | Change Type | Description |
|------|------------|-------------|
| `android/app/build.gradle` | Modify | Add `play-services-location` dependency |
| `AndroidManifest.xml` | Modify | Add GMS activity recognition permission + receiver declaration |
| `step/ActivityRecognitionReceiver.kt` | **New** | BroadcastReceiver that stores latest activity type |
| `step/StepTrackingService.kt` | Modify | Start/stop Activity Recognition, add filter in onSensorChanged |
| `step/StepCounterHelper.kt` | Modify | Add `updateLastSensorValue()` method |

---

## What We Are NOT Changing

- Step sensor registration (TYPE_STEP_COUNTER, same params)
- StepCounterModule.kt bridge methods (except live updates stay unfiltered)
- SharedPreferences storage format for daily_steps
- Widget update logic
- TypeScript/React Native layer — fully transparent, no JS changes needed
- Session tracking (startSession/getSessionSteps)

---

## Optional Future Enhancements (Not in This Implementation)

These are mentioned in the guidance doc but are **not included** in this plan to keep the scope minimal:

1. **Minimum step burst** — require 8-10 consecutive steps before counting
2. **Cadence validation** — reject steps at non-walking frequencies
3. **User-facing toggle** — let users enable/disable the filter in settings

These can be added later if the Activity Recognition filter alone isn't sufficient.

---

## Testing Plan

1. **Walk with the app** — verify steps still count normally
2. **Sit at desk and scroll phone** — verify steps are NOT counted
3. **Start walking, then stop** — verify the grace period captures final steps
4. **Reboot the device** — verify service restarts and filter works after boot
5. **Start a workout session** — verify live step updates are unfiltered during sessions
6. **Check battery usage** — Activity Recognition at 3s interval should have negligible battery impact (it runs on a low-power coprocessor)
7. **Kill and reopen the app** — verify foreground service and activity recognition survive

---

## Battery Impact

- Activity Recognition API runs on a dedicated low-power coprocessor (same as the step sensor)
- 3-second detection interval is the recommended balance between responsiveness and battery
- SharedPreferences reads in `onSensorChanged` are fast (cached in memory by Android)
- Net battery impact: **negligible** — the hardware was already doing activity classification internally
