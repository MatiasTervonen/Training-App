# Fix: Activity Recognition Step Filter Not Working

## Context

The Activity Recognition step filter was implemented but isn't filtering any steps. Standing still and waving the phone up/down still counts everything. We need to add diagnostic logging to determine whether Activity Recognition updates are even being received, and fix any issues found.

## Diagnosis

The permission (`ACTIVITY_RECOGNITION`) is already granted (it's the same one used for step counting). The manifest, receiver, and dependency all look correct. Two possible failure modes:

1. **Activity Recognition never delivers updates** — the receiver's `onReceive()` is never called, so `current_activity_type` stays at `UNKNOWN`, and the fail-open logic (`if (activityType == UNKNOWN) return true`) accepts everything
2. **Updates are delivered but classified as something unexpected** — e.g., `TILTING` instead of `STILL` when waving the phone

## Fix: Add diagnostic logging + guard against duplicate registration

### 1. Add logging to `shouldCountStep()` (StepTrackingService.kt)

Log the current activity state periodically so we can see what's happening via `adb logcat`:

```kotlin
private var stepCheckCount = 0L

private fun shouldCountStep(): Boolean {
    val prefs = getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
    val activityType = prefs.getInt(...)
    val activityConfidence = prefs.getInt(...)
    val lastWalkingTime = prefs.getLong(...)

    stepCheckCount++
    // Log every 10th check to avoid spam
    if (stepCheckCount % 10 == 0L) {
        Log.d(TAG, "shouldCountStep: type=$activityType, confidence=$activityConfidence, lastWalk=$lastWalkingTime")
    }
    // ... rest of logic
}
```

### 2. Add permission check + logging to `startActivityRecognition()` (StepTrackingService.kt)

Even though the permission should be granted, add an explicit check and log:

```kotlin
private fun startActivityRecognition() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val granted = ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED
        Log.d(TAG, "ACTIVITY_RECOGNITION permission granted: $granted")
        if (!granted) {
            Log.w(TAG, "Step filter disabled — permission not granted")
            return
        }
    }
    // ... existing requestActivityUpdates code
}
```

### 3. Guard against duplicate setup in `onStartCommand()` (StepTrackingService.kt)

Add boolean flags so sensor/receiver aren't registered multiple times on repeated `startService()` calls. Activity recognition gets a separate flag so it can be retried after permission grant:

```kotlin
private var isSetUp = false
private var isActivityRecognitionActive = false
```

### 4. Enhance logging in `ActivityRecognitionReceiver.kt`

The receiver already logs, but add a log at the very start of `onReceive()` (before the `hasResult` check) to confirm the receiver is being triggered at all:

```kotlin
override fun onReceive(context: Context, intent: Intent) {
    Log.d(TAG, "onReceive triggered, hasResult=${ActivityRecognitionResult.hasResult(intent)}")
    // ... rest
}
```

## Files to Modify

| File | Change |
|------|--------|
| `mobile/android/.../step/StepTrackingService.kt` | Add permission check, duplicate-start guard, diagnostic logging |
| `mobile/android/.../step/ActivityRecognitionReceiver.kt` | Add entry-point logging |

## Verification

1. Build with `npx expo run:android`
2. Run `adb logcat -s StepTrackingService:D ActivityRecognition:D`
3. Watch logs while standing still + waving phone — this tells us:
   - Is the permission granted?
   - Is activity recognition starting successfully?
   - Is the receiver getting updates?
   - What activity type/confidence is being reported?
   - Is `shouldCountStep()` returning true or false, and why?
4. Based on logs, we'll know the exact issue and can fix further if needed
