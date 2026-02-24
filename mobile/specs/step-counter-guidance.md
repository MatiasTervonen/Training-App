# Step Counter Fix: Add Activity Recognition Filtering

## Current Setup

The app already has a fully working native Android step counter implementation. It uses the hardware step sensor (`TYPE_STEP_COUNTER` or `TYPE_STEP_DETECTOR`) and reads step data correctly. All sensor registration, listeners, and step counting logic are already wired and functional.

## Problem

The step sensor counts false steps when the user is sitting still and making small hand movements while holding the phone. The hardware step detection algorithm cannot distinguish real walking from repetitive hand motion.

## What Needs to Change

Do NOT rewrite or replace the existing step counter logic. The only change needed is to add Google's Activity Recognition API as a **gate/filter** on top of the existing step counting. The existing sensor code stays the same — we just wrap the step acceptance logic with an activity check.

## Implementation Steps

### 1. Add Dependency (if not already present)

```gradle
implementation 'com.google.android.gms:play-services-location:21.0.1'
```

### 2. Add Permission to AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
```

Request `ACTIVITY_RECOGNITION` permission at runtime for Android 10+ (API 29+).

### 3. Create an Activity Recognition Service/Receiver

Set up `ActivityRecognitionClient` to request activity updates. Register a `BroadcastReceiver` or use `PendingIntent` to receive activity detection results. Set detection interval to around 3000-5000ms.

### 4. Store the Current Activity State

Maintain a variable (e.g., in a singleton, ViewModel, or shared state) that holds the latest detected activity type and confidence. Update this variable every time the Activity Recognition API delivers a new result.

### 5. Modify the Existing Step Counting Logic

Find the place in the existing code where steps are counted or recorded (the `onSensorChanged` callback or wherever the step value is incremented/stored). Add a check **before** accepting the step:

```
Before (current):
  → Sensor reports step → Count it

After (with filter):
  → Sensor reports step → Is user WALKING / RUNNING / ON_FOOT with confidence >= 70? → YES → Count it
  → Sensor reports step → Is user STILL / IN_VEHICLE / other? → Ignore it
```

The valid activity types to accept steps are:
- `DetectedActivity.WALKING`
- `DetectedActivity.RUNNING`
- `DetectedActivity.ON_FOOT`

Discard steps for all other activity types including `STILL`, `IN_VEHICLE`, `ON_BICYCLE`, `TILTING`.

### 6. Optional Additional Filtering

- **Minimum step burst**: Require at least 8-10 consecutive steps before counting. A sitting person rarely produces 10 continuous walking-like movements.
- **Cadence validation**: Real walking is approximately 1-2 steps per second. Discard steps at unusual frequencies.
- **Transition grace period**: When activity changes from STILL to WALKING, wait 2-3 seconds before counting. When changing from WALKING to STILL, count for 1-2 more seconds to capture final real steps.

### 7. Start and Stop Activity Recognition with the Step Sensor

Activity Recognition should be started and stopped at the same lifecycle points as the existing step sensor registration. If the step sensor is registered in a service, register Activity Recognition there too. If it is in an activity or fragment, match the same lifecycle.

## What NOT to Do

- Do not remove or replace the existing step sensor logic.
- Do not change how the sensor is registered or how step values are read.
- Do not move step counting to Activity Recognition — it does not count steps, it only detects what activity the user is doing.
- Do not use Activity Recognition alone as a step counter.

## Architecture Summary

```
Existing Step Sensor (unchanged)
        |
        v
  New filter: Is Activity Recognition reporting
  WALKING / RUNNING / ON_FOOT with confidence >= 70?
        |
    YES |          NO
        v           v
  Existing step      Ignore the step
  counting logic     (do nothing)
  (unchanged)
```

## Key Points

- The existing step counter code does not need to be rewritten. Only a single conditional check needs to be added where steps are accepted.
- Activity Recognition runs in parallel and only provides the current activity state.
- This is a minimal, additive change to the existing codebase.
