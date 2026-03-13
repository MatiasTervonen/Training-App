# Activity Milestone Alerts

## Context

During longer activities (walking, running, cycling), users don't constantly look at their screen. The phone is in a pocket, on an armband, or sitting on a treadmill. Milestone alerts notify the user with a sound + vibration when they reach configurable thresholds — e.g., every 1000 steps, every 10 minutes, every 1 km, or every 100 calories. This keeps users motivated without breaking their flow.

**This must work when the app is in the background** (phone in pocket). The user starts a session, puts the phone away, and still gets audible + vibration alerts at each milestone. When the app is in the foreground, the user also sees a toast overlay on screen.

## Requirements

- **Works in background**: Milestone alerts fire even when the app is backgrounded or the screen is off. The `TimerService` (Android foreground service) already runs during all activity sessions — it will be extended to check milestones on each tick.
- **Works in foreground**: When the app is visible, the React hook plays sound via `expo-audio` (with audio ducking), fires haptic vibration, and shows a toast overlay.
- **Android notification for background**: When the app is backgrounded, `TimerService` fires an Android notification with sound + vibration for each milestone hit.
- **No double alerts**: When the app is in foreground, the native service skips firing notifications (the React hook handles it). When backgrounded, only the native notification fires.
- **Sound (foreground)**: Same sound as gym rest timer (`mixkit_alert_bells_echo_765.wav`) via `expo-audio`
- **Audio ducking (foreground)**: If music is playing, lower its volume briefly — never stop it. Already handled by `setAudioModeAsync({ interruptionMode: "duckOthers" })`
- **Haptic vibration (foreground)**: `Haptics.NotificationFeedbackType.Success` alongside the sound
- **Toast overlay (foreground)**: Brief text banner on screen showing which milestone was hit (e.g., "1000 steps!"). Auto-dismisses after 3-4 seconds.
- **Single sound for all milestones**: One sound for every metric. The toast / notification text tells the user *which* milestone was hit.
- **Configurable**: User picks which metrics to alert on and at what interval
- **Per-metric toggle + interval**: Each metric (steps, duration, distance, calories) can be independently enabled with a chosen interval
- **Activity sessions only**: Not for gym sessions (user is already looking at phone between sets)
- **Fire once per threshold**: Each milestone fires exactly once (e.g., 1000 steps alert fires at 1000, not again until 2000)

---

## Supported Milestones

| Metric | Interval Options | Default |
|--------|-----------------|---------|
| **Steps** | 500, 1000, 2000, 5000 | Off |
| **Duration** | 5 min, 10 min, 15 min, 30 min | Off |
| **Distance** | 0.5 km, 1 km, 2 km, 5 km | Off |
| **Calories** | 50, 100, 200, 500 | Off |

All milestones are **off by default**. The user must explicitly enable each one they want.

---

## Architecture Overview

Milestone checking happens in **two places** depending on whether the app is in foreground or background:

### Foreground (app visible)
- **React hook** (`useMilestoneAlerts`) checks thresholds on each metric update
- Plays sound via `expo-audio` (with audio ducking so music volume dips briefly)
- Fires haptic vibration
- Shows toast overlay on screen
- Tells the native service "app is in foreground" so it doesn't also fire a notification

### Background (phone in pocket / screen off)
- **TimerService** (Kotlin, already runs as a foreground service during all activity sessions) is extended to check milestones on its 1-second tick
- Checks: **duration** (from elapsed time), **steps** (registers its own step sensor listener), **calories** (calculated from elapsed time × MET × weight)
- **Distance**: checked in the `locationTask.ts` JS background task (only runs during GPS sessions), which updates cumulative distance in SharedPreferences. TimerService reads this value on each tick.
- When a milestone is hit → fires an Android notification with sound + vibration
- The notification uses the existing `milestone_alerts` channel (HIGH importance, with sound)

### Foreground/Background Coordination
- JS calls `NativeTimer.setAppInForeground(true/false)` when `AppState` changes
- TimerService stores this flag in memory
- When `appInForeground = true` → TimerService skips firing notifications (React hook handles it)
- When `appInForeground = false` → TimerService fires notifications
- **TimerService is the source of truth for threshold state.** It persists `nextThresholds` to SharedPreferences on every milestone hit.
- When the React hook resumes (app returns to foreground), it reads thresholds from the native service via `getMilestoneThresholds()` — NOT from current metrics (which may be stale before hydration). This prevents re-firing milestones that were already notified in the background.

---

## How It Works

### Alert Flow (Foreground)
1. Activity session is running → live metrics update every second (steps, duration, calories, distance)
2. The milestone hook checks each enabled metric against its next threshold
3. When a metric crosses its threshold:
   - Play `mixkit_alert_bells_echo_765.wav` (ducking other audio)
   - Fire haptic vibration (`Haptics.NotificationFeedbackType.Success`)
   - Show toast overlay with milestone text (e.g., "1000 steps!", "10 min!", "1 km!")
   - Advance the next threshold for that metric (e.g., 1000 → 2000)
4. Multiple metrics can fire at the same time — play the sound once, show all milestones in the same toast
5. When session is paused, no alerts fire (metrics stop updating)
6. When session ends/resets, all thresholds reset

### Alert Flow (Background)
1. Activity session is running → TimerService ticks every 1 second
2. On each tick, TimerService checks enabled milestones:
   - **Duration**: `(System.currentTimeMillis() - startTime) / 1000` vs next duration threshold
   - **Steps**: Reads session steps from step sensor (registered in TimerService) using the session baseline from SharedPreferences
   - **Calories**: `baseMet × weight × (elapsedSeconds / 3600)` vs next calorie threshold
   - **Distance**: Reads cumulative distance from SharedPreferences (updated by `locationTask.ts`)
3. When a metric crosses its threshold:
   - Fire Android notification with sound + vibration (uses `milestone_alerts` channel)
   - Notification text: e.g., "1000 steps!", "10 min!", "2 km!"
   - Advance the next threshold for that metric
4. When session is paused (TimerService `isPaused = true`), no milestone checks happen
5. When session ends (TimerService stopped), all thresholds are cleared

### Toast Overlay (Foreground only)
- Small banner displayed on top of the session screen (both GPS map view and non-GPS stats view)
- Shows the milestone text: "1000 steps!", "10 min!", "2 km!", "200 cal!"
- If multiple milestones fire at once, show all on separate lines in the same toast
- Auto-dismisses after 3-4 seconds with a fade-out animation
- Positioned at the top of the screen, below the status bar, so it doesn't cover controls
- Semi-transparent dark background with white text (matches app theme)
- Does NOT block touch events on the screen below it (pointerEvents="none")

### Threshold Tracking
- For each enabled metric, track a `nextThreshold` value (starts at the interval value)
- When `currentValue >= nextThreshold`, fire alert and set `nextThreshold += interval`
- **React hook**: ephemeral state in `useRef`, resets each session
- **TimerService**: in-memory variables, reset when service stops
- Both are initialized from the same milestone settings in SharedPreferences

---

## Configuration Flow

1. User configures milestones in Activity Settings (stored in Zustand with MMKV persistence)
2. When an activity session starts, JS writes milestone config to SharedPreferences via `NativeTimer.setMilestoneConfig(...)`:
   - Enabled flags + intervals for each metric
   - `baseMet` value for the selected activity (for calorie calculation)
   - `userWeight` in kg
   - Session start time (already passed to TimerService)
3. TimerService reads the config and initializes its threshold tracking
4. When session ends, JS calls `NativeTimer.clearMilestoneConfig()` — thresholds reset

---

## Files to Create

### 1. `features/activities/hooks/useMilestoneAlerts.ts` — Core Hook (Foreground)

Hook that monitors live metrics, fires sound + haptic alerts, and returns toast messages for the UI to display. Only fires when the app is in the foreground.

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import { setAppInForeground, getMilestoneThresholds } from "@/native/android/NativeTimer";

// Set up audio ducking (same as rest timer — lowers music instead of stopping it)
setAudioModeAsync({
  interruptionMode: "duckOthers",
  interruptionModeAndroid: "duckOthers",
});

const milestoneSound = createAudioPlayer(
  require("@/assets/audio/mixkit_alert_bells_echo_765.wav"),
);

interface MilestoneMetrics {
  steps: number;
  durationSeconds: number;
  distanceMeters: number;
  calories: number;
}

interface ThresholdState {
  steps: number | null;      // null = disabled
  duration: number | null;
  distance: number | null;
  calories: number | null;
}

export interface MilestoneToast {
  id: string;
  lines: string[];  // e.g., ["1000 steps!", "10 min!"]
}

export function useMilestoneAlerts(
  metrics: MilestoneMetrics,
  isActive: boolean,  // session is running (not paused)
) {
  const [toast, setToast] = useState<MilestoneToast | null>(null);
  const thresholds = useRef<ThresholdState>({
    steps: null,
    duration: null,
    distance: null,
    calories: null,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInForeground = useRef(AppState.currentState === "active");

  const milestoneSettings = useActivitySettingsStore(
    (s) => s.milestoneAlerts,
  );

  // Track foreground/background state and tell native service
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      const wasForeground = isInForeground.current;
      isInForeground.current = nextState === "active";

      // Tell native TimerService whether to fire notifications or not
      setAppInForeground(nextState === "active");

      // When returning to foreground, read thresholds from the native service.
      // DO NOT recalculate from metrics — they may be stale (not yet hydrated).
      // TimerService is the source of truth for where thresholds stand.
      if (!wasForeground && nextState === "active" && isActive) {
        const nativeThresholds = await getMilestoneThresholds();
        if (nativeThresholds) {
          thresholds.current = {
            steps: nativeThresholds.steps,
            duration: nativeThresholds.durationSecs,
            distance: nativeThresholds.distanceMeters,
            calories: nativeThresholds.calories,
          };
        }
      }
    });

    // Set initial state
    setAppInForeground(true);

    return () => {
      subscription.remove();
      setAppInForeground(false);
    };
  }, [isActive]);

  const showToast = useCallback((lines: string[]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToast({ id: Date.now().toString(), lines });

    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3500);
  }, []);

  // Initialize thresholds when session becomes active
  useEffect(() => {
    if (!isActive || !milestoneSettings) return;

    thresholds.current = {
      steps: milestoneSettings.steps.enabled
        ? milestoneSettings.steps.interval
        : null,
      duration: milestoneSettings.duration.enabled
        ? milestoneSettings.duration.interval * 60
        : null,
      distance: milestoneSettings.distance.enabled
        ? milestoneSettings.distance.interval * 1000
        : null,
      calories: milestoneSettings.calories.enabled
        ? milestoneSettings.calories.interval
        : null,
    };
  }, [isActive, milestoneSettings]);

  // Check thresholds on every metric update (foreground only)
  useEffect(() => {
    if (!isActive || !isInForeground.current) return;

    const t = thresholds.current;
    const hitLines: string[] = [];

    if (t.steps !== null && metrics.steps >= t.steps) {
      hitLines.push(`${t.steps} steps!`);  // Use translated strings in implementation
      t.steps += milestoneSettings.steps.interval;
    }

    if (t.duration !== null && metrics.durationSeconds >= t.duration) {
      const mins = t.duration / 60;
      hitLines.push(`${mins} min!`);
      t.duration += milestoneSettings.duration.interval * 60;
    }

    if (t.distance !== null && metrics.distanceMeters >= t.distance) {
      const km = t.distance / 1000;
      hitLines.push(`${km} km!`);
      t.distance += milestoneSettings.distance.interval * 1000;
    }

    if (t.calories !== null && metrics.calories >= t.calories) {
      hitLines.push(`${t.calories} cal!`);
      t.calories += milestoneSettings.calories.interval;
    }

    if (hitLines.length > 0) {
      milestoneSound.seekTo(0);
      milestoneSound.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(hitLines);
    }
  }, [
    isActive,
    metrics.steps,
    metrics.durationSeconds,
    metrics.distanceMeters,
    metrics.calories,
    milestoneSettings,
    showToast,
  ]);

  // Reset thresholds when session deactivates
  useEffect(() => {
    if (!isActive) {
      thresholds.current = {
        steps: null,
        duration: null,
        distance: null,
        calories: null,
      };
    }
  }, [isActive]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return { toast };
}
```

### 2. `features/activities/components/MilestoneToast.tsx` — Toast Overlay

Animated toast component that displays milestone text and auto-fades out.

```typescript
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import AppText from "@/components/AppText";
import { MilestoneToast as MilestoneToastType } from "@/features/activities/hooks/useMilestoneAlerts";

interface Props {
  toast: MilestoneToastType | null;
}

export default function MilestoneToast({ toast }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      // Fade in
      opacity.value = withTiming(1, { duration: 200 });
      // Fade out after 3 seconds
      opacity.value = withDelay(3000, withTiming(0, { duration: 500 }));
    }
  }, [toast, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={animatedStyle}
      className="absolute top-12 left-0 right-0 z-50 items-center"
    >
      <View className="bg-black/80 rounded-xl px-6 py-3">
        {toast.lines.map((line, i) => (
          <AppText key={i} className="text-white text-lg text-center">
            {line}
          </AppText>
        ))}
      </View>
    </Animated.View>
  );
}
```

**Toast behavior:**
- Fades in over 200ms when a milestone fires
- Stays visible for ~3 seconds
- Fades out over 500ms
- `pointerEvents="none"` so it never blocks map gestures or button taps
- If a new milestone fires while toast is showing, it replaces the content and resets the timer
- Positioned at top of screen, centered horizontally
- Semi-transparent dark background (`bg-black/80`) with white text

---

## Files to Modify

### 1. `lib/stores/activitySettingsStore.ts` — Add Milestone Settings

Add milestone alert configuration to the existing activity settings store.

```typescript
interface MilestoneMetricSetting {
  enabled: boolean;
  interval: number;  // steps: raw count, duration: minutes, distance: km, calories: raw count
}

interface MilestoneAlertSettings {
  steps: MilestoneMetricSetting;
  duration: MilestoneMetricSetting;
  distance: MilestoneMetricSetting;
  calories: MilestoneMetricSetting;
}

// Add to ActivitySettings interface:
milestoneAlerts: MilestoneAlertSettings;

// Default values:
milestoneAlerts: {
  steps: { enabled: false, interval: 1000 },
  duration: { enabled: false, interval: 10 },      // 10 minutes
  distance: { enabled: false, interval: 1 },        // 1 km
  calories: { enabled: false, interval: 100 },
},

// Add setter:
setMilestoneAlerts: (alerts: MilestoneAlertSettings) =>
  set({ milestoneAlerts: alerts }),
```

### 2. `app/activities/settings/index.tsx` — Add Milestone Settings UI

Add a new section below the existing line color selector.

```
┌─────────────────────────────────────┐
│       Activity Settings             │
│                                     │
│  [Map Preview]                      │
│  [Map Style Selector]               │
│  [Line Color Selector]              │
│                                     │
│  ── Milestone Alerts ──────────     │
│  (small description text)           │
│                                     │
│  Steps               [Toggle OFF]   │
│  Duration             [Toggle OFF]   │
│  Distance             [Toggle OFF]   │
│  Calories             [Toggle OFF]   │
│                                     │
│  ─── after toggling Steps ON ───    │
│                                     │
│  Steps                [Toggle ON]   │
│  ┌─────────────────────────────┐    │
│  │ ○  Every 500                │    │
│  │ ●  Every 1000  (default)    │    │
│  │ ○  Every 2000               │    │
│  │ ○  Every 5000               │    │
│  └─────────────────────────────┘    │
│  Duration             [Toggle OFF]   │
│  Distance             [Toggle OFF]   │
│  Calories             [Toggle OFF]   │
└─────────────────────────────────────┘
```

**Implementation:**
- Each metric is a row with label + `Toggle` component (`components/toggle.tsx`)
- Toggle OFF → collapsed, interval options hidden, `enabled: false`
- Toggle ON → expands to show interval radio buttons below, `enabled: true`
- All toggles are **OFF by default** → section stays compact
- When toggling ON, use the stored interval (default: 1000 steps, 10 min, 1 km, 100 cal)
- When toggling OFF, keep the stored interval so it's remembered if re-enabled
- Expand/collapse should animate smoothly (use `LayoutAnimation` or `react-native-reanimated` height animation)
- Use `AnimatedButton` for each interval option (consistent with existing style)
- Read/write from `useActivitySettingsStore`
- The settings page needs a `ScrollView` wrapping `PageContainer` (page is now longer than one screen when metrics are expanded)

### 3. `app/activities/start-activity/index.tsx` — Mount the Hook + Render Toast + Pass Config to Native

Add `useMilestoneAlerts` to the start-activity screen, render the toast overlay, and pass milestone config to `TimerService` when the session starts.

```typescript
import { useMilestoneAlerts } from "@/features/activities/hooks/useMilestoneAlerts";
import MilestoneToast from "@/features/activities/components/MilestoneToast";
import { setMilestoneConfig, clearMilestoneConfig } from "@/native/android/NativeTimer";

// When session starts (where startNativeTimer is already called), also pass milestone config:
const milestoneSettings = useActivitySettingsStore((s) => s.milestoneAlerts);

// After calling startNativeTimer(...):
setMilestoneConfig({
  steps: milestoneSettings.steps,
  duration: milestoneSettings.duration,
  distance: milestoneSettings.distance,
  calories: milestoneSettings.calories,
  baseMet: selectedActivity.baseMet,    // MET value for calorie calculation
  userWeight: userWeight,                // kg
});

// When session ends (where stopNativeTimer is called):
clearMilestoneConfig();

// Inside StartActivityScreen, after the existing metric calculations:
const { toast } = useMilestoneAlerts(
  {
    steps,
    durationSeconds: effectiveMovingTime,
    distanceMeters: meters,
    calories: liveCalories,
  },
  isRunning,
);

// In the JSX, render the toast at the top level of both GPS and non-GPS views:
// For GPS view (FullScreenMap): add <MilestoneToast toast={toast} /> inside the <View className="flex-1"> wrapper
// For non-GPS view (SessionStats): add <MilestoneToast toast={toast} /> inside the <View className="flex-1 bg-slate-950"> wrapper
// The toast positions itself absolutely at the top of its parent container
```

### 4. `native/android/NativeTimer.ts` — Add Milestone Methods

Add new methods for milestone configuration and foreground state tracking.

```typescript
// Add these new exports:

export function setMilestoneConfig(config: {
  steps: { enabled: boolean; interval: number };
  duration: { enabled: boolean; interval: number };
  distance: { enabled: boolean; interval: number };
  calories: { enabled: boolean; interval: number };
  baseMet: number;
  userWeight: number;
}) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.setMilestoneConfig(
      JSON.stringify(config),
    );
  }
}

export function clearMilestoneConfig() {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.clearMilestoneConfig();
  }
}

export function setAppInForeground(inForeground: boolean) {
  if (Platform.OS === "android" && nativeTimer) {
    nativeTimer.setAppInForeground(inForeground);
  }
}

export async function getMilestoneThresholds(): Promise<{
  steps: number | null;
  durationSecs: number | null;
  distanceMeters: number | null;
  calories: number | null;
} | null> {
  if (Platform.OS !== "android" || !nativeTimer) return null;
  // TimerService writes its current nextThresholds to SharedPreferences
  // on every milestone hit. This reads those values so the React hook
  // can pick up exactly where the native service left off — no stale
  // metric race condition on foreground resume.
  const json = await nativeTimer.getMilestoneThresholds();
  if (!json) return null;
  return JSON.parse(json);
}
```

### 5. `android/.../timer/TimerModule.kt` — Add Native Methods

Add the three new `@ReactMethod` functions that bridge to SharedPreferences / TimerService:

```kotlin
@ReactMethod
fun setMilestoneConfig(configJson: String) {
    // Store config in SharedPreferences so TimerService can read it
    val prefs = reactApplicationContext.getSharedPreferences("milestone_config", Context.MODE_PRIVATE)
    prefs.edit().putString("config", configJson).apply()

    // Tell running TimerService to reload config
    val intent = Intent(reactApplicationContext, TimerService::class.java)
    intent.putExtra("action", "reload_milestones")
    reactApplicationContext.startService(intent)
}

@ReactMethod
fun clearMilestoneConfig() {
    val prefs = reactApplicationContext.getSharedPreferences("milestone_config", Context.MODE_PRIVATE)
    prefs.edit().clear().apply()

    val intent = Intent(reactApplicationContext, TimerService::class.java)
    intent.putExtra("action", "clear_milestones")
    reactApplicationContext.startService(intent)
}

@ReactMethod
fun setAppInForeground(inForeground: Boolean) {
    val intent = Intent(reactApplicationContext, TimerService::class.java)
    intent.putExtra("action", "set_foreground")
    intent.putExtra("inForeground", inForeground)
    reactApplicationContext.startService(intent)
}

@ReactMethod
fun getMilestoneThresholds(promise: Promise) {
    // TimerService persists its nextThresholds to SharedPreferences on every milestone hit.
    // The React hook reads this on foreground resume to sync up — avoids re-firing
    // milestones that the native service already notified about while backgrounded.
    val prefs = reactApplicationContext.getSharedPreferences("milestone_thresholds", Context.MODE_PRIVATE)
    val json = prefs.getString("thresholds", null)
    promise.resolve(json)
}
```

### 6. `android/.../timer/TimerService.kt` — Add Milestone Checking

Extend the existing `TimerService` to check milestones on each tick. Key changes:

```kotlin
// New fields in TimerService:
private var appInForeground = true
private var milestoneConfig: MilestoneConfig? = null
private var nextThresholds = MilestoneThresholds()  // tracks next threshold for each metric
private var stepSensorManager: SensorManager? = null
private var milestoneStepListener: SensorEventListener? = null
private var sessionBaselineSteps: Long = -1L

// Data classes:
data class MilestoneMetricConfig(val enabled: Boolean, val interval: Double)
data class MilestoneConfig(
    val steps: MilestoneMetricConfig,
    val duration: MilestoneMetricConfig,
    val distance: MilestoneMetricConfig,
    val calories: MilestoneMetricConfig,
    val baseMet: Double,
    val userWeight: Double,
)
data class MilestoneThresholds(
    var steps: Long? = null,        // null = disabled
    var durationSecs: Long? = null,
    var distanceMeters: Double? = null,
    var calories: Double? = null,
)

// Handle new actions in onStartCommand:
"reload_milestones" -> {
    loadMilestoneConfig()
    return START_STICKY
}
"clear_milestones" -> {
    milestoneConfig = null
    nextThresholds = MilestoneThresholds()
    unregisterMilestoneStepListener()
    return START_STICKY
}
"set_foreground" -> {
    appInForeground = intent?.getBooleanExtra("inForeground", true) ?: true
    return START_STICKY
}

// loadMilestoneConfig():
// - Reads JSON from SharedPreferences("milestone_config")
// - Parses into MilestoneConfig
// - Initializes nextThresholds (e.g., steps interval = 1000 → nextThresholds.steps = 1000)
// - If steps milestone enabled, registers a step sensor listener
// - Reads session baseline from SharedPreferences("step_counter_prefs", "session_start_value")

// In the tickRunnable (runs every 1 second), add after the time update:
checkMilestones(millis / 1000)  // pass elapsed seconds

// checkMilestones(elapsedSeconds: Long):
fun checkMilestones(elapsedSeconds: Long) {
    if (isPaused || milestoneConfig == null || appInForeground) return

    val config = milestoneConfig!!
    val t = nextThresholds
    val hitLines = mutableListOf<String>()

    // Duration
    if (t.durationSecs != null && elapsedSeconds >= t.durationSecs!!) {
        val mins = t.durationSecs!! / 60
        hitLines.add("$mins min!")
        t.durationSecs = t.durationSecs!! + (config.duration.interval * 60).toLong()
    }

    // Steps (from sensor listener)
    if (t.steps != null && currentSessionSteps >= t.steps!!) {
        hitLines.add("${t.steps} steps!")
        t.steps = t.steps!! + config.steps.interval.toLong()
    }

    // Calories (baseMet × weight × hours)
    if (t.calories != null) {
        val currentCalories = config.baseMet * config.userWeight * (elapsedSeconds.toDouble() / 3600.0)
        if (currentCalories >= t.calories!!) {
            hitLines.add("${t.calories!!.toInt()} cal!")
            t.calories = t.calories!! + config.calories.interval
        }
    }

    // Distance (read from SharedPreferences, updated by JS background location task)
    if (t.distanceMeters != null) {
        val distPrefs = getSharedPreferences("milestone_distance", Context.MODE_PRIVATE)
        val currentDistance = distPrefs.getFloat("cumulative_meters", 0f).toDouble()
        if (currentDistance >= t.distanceMeters!!) {
            val km = t.distanceMeters!! / 1000.0
            hitLines.add("$km km!")
            t.distanceMeters = t.distanceMeters!! + config.distance.interval * 1000.0
        }
    }

    if (hitLines.isNotEmpty()) {
        fireMilestoneNotification(hitLines)
        persistThresholds()  // Save so React hook can sync on foreground resume
    }
}

// persistThresholds():
// Writes current nextThresholds to SharedPreferences("milestone_thresholds")
// as JSON: { steps: 2000, durationSecs: 600, distanceMeters: null, calories: null }
// Called after every milestone hit so the React hook can read exact threshold
// state on foreground resume — prevents re-firing already-notified milestones.
// Also called when thresholds are first initialized (session start).

// fireMilestoneNotification(lines: List<String>):
// - Creates/ensures "milestone_alerts" notification channel (IMPORTANCE_HIGH, with sound + vibration)
// - Builds notification with title "Milestone!" and body = lines joined with ", "
// - Uses a FIXED notification ID (e.g., 3001) so each new milestone REPLACES the previous one (no stacking)
// - setAutoCancel(true) so tapping dismisses it
// - Auto-dismiss after 15 seconds using setTimeoutAfter(15000) — notification disappears from the
//   shade automatically. Long enough to glance at the lock screen, short enough to not clutter.
// - Uses same small icon as other notifications
```

**Step sensor listener in TimerService:**
```kotlin
// Register when milestone config has steps enabled:
private fun registerMilestoneStepListener() {
    val sm = getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
    val sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return

    // Read session baseline (set by JS when session started)
    val prefs = getSharedPreferences("step_counter_prefs", Context.MODE_PRIVATE)
    sessionBaselineSteps = prefs.getLong("session_start_value", -1L)

    milestoneStepListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
            val currentValue = event.values[0].toLong()
            currentSessionSteps = if (sessionBaselineSteps == -1L) 0
                else maxOf(currentValue - sessionBaselineSteps, 0)
        }
        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

    sm.registerListener(milestoneStepListener, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    stepSensorManager = sm
}
```

### 7. `features/activities/lib/locationTask.ts` — Update Cumulative Distance

After saving GPS points, update the cumulative distance in SharedPreferences so TimerService can check distance milestones.

```typescript
// At the end of the task (after the for loop), add:
// Calculate cumulative distance from all non-stationary, non-bad-signal points
import AsyncStorage from "@react-native-async-storage/async-storage";
// OR use expo-secure-store / SharedPreferences bridge

// Actually, SharedPreferences is native-only. Use a simpler approach:
// The locationTask already has access to the database.
// After saving points, query total distance and write to a shared location.

// Option: Write to SQLite (a dedicated table or a known key-value row)
// that TimerService can read. But TimerService is Kotlin and doesn't read SQLite easily.

// Best approach: Use NativeModules to call a method that writes to SharedPreferences.
// But background tasks can't easily access NativeModules.

// Simplest reliable approach:
// After the for-loop, calculate cumulative distance from the database and write
// to a file or use the existing NativeStepCounter pattern.
// Actually: just use SharedPreferences via a direct Android API call from the
// expo-modules bridge. Or...

// SIMPLEST: Write cumulative distance to AsyncStorage (which IS SharedPreferences on Android).
// The locationTask runs in JS context, so AsyncStorage works.

// After the for loop in locationTask.ts:
try {
  const allPoints = await db.getAllAsync<{
    latitude: number;
    longitude: number;
    is_stationary: number;
    bad_signal: number;
    accuracy: number | null;
  }>(
    `SELECT latitude, longitude, is_stationary, bad_signal, accuracy
     FROM gps_points
     WHERE is_stationary = 0 AND bad_signal = 0
     ORDER BY timestamp ASC`
  );

  let totalDistance = 0;
  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    if (curr.accuracy && curr.accuracy > 30) continue;
    const dist = haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    if (dist >= 2) totalDistance += dist;
  }

  // Write to SharedPreferences for TimerService to read
  // AsyncStorage on Android IS SharedPreferences under the hood
  // Key convention: use a known key that TimerService reads
  const SharedPreferences = require("react-native").NativeModules.NativeTimer;
  SharedPreferences?.updateCumulativeDistance?.(totalDistance);
} catch (e) {
  // Non-critical — foreground distance tracking still works
  debugLog("BG_TASK", `Distance update failed: ${e}`);
}
```

**Note:** Add a `updateCumulativeDistance` method to `TimerModule.kt`:
```kotlin
@ReactMethod
fun updateCumulativeDistance(meters: Double) {
    val prefs = reactApplicationContext.getSharedPreferences("milestone_distance", Context.MODE_PRIVATE)
    prefs.edit().putFloat("cumulative_meters", meters.toFloat()).apply()
}
```

### 8. `features/push-notifications/actions.ts` — Add Milestone Notification Channel

Add the milestone alerts channel in `configureNotificationChannels()`:

```typescript
// Add to the Promise.all array:
Notifications.setNotificationChannelAsync("milestone_alerts", {
  name: "Activity Milestones",
  importance: Notifications.AndroidImportance.HIGH,
  sound: "default",
  vibrationPattern: [0, 300, 100, 300],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
}),
```

**Note:** The TimerService creates this channel natively too (idempotent), but having it in the JS channel setup ensures it appears in system notification settings from the start.

### 9. `locales/en/activities.json`

Add under `"activities"`:

```json
"milestoneAlerts": {
  "title": "Milestone Alerts",
  "description": "Get notified when you reach a milestone during an activity",
  "off": "Off",
  "steps": "Steps",
  "duration": "Duration",
  "distance": "Distance",
  "calories": "Calories",
  "everySteps": "Every {{count}}",
  "everyMinutes": "Every {{count}} min",
  "everyKm": "Every {{count}} km",
  "everyCalories": "Every {{count}}",
  "toastSteps": "{{count}} steps!",
  "toastMinutes": "{{count}} min!",
  "toastKm": "{{count}} km!",
  "toastCalories": "{{count}} cal!"
}
```

### 10. `locales/fi/activities.json`

Add under `"activities"`:

```json
"milestoneAlerts": {
  "title": "Välitavoiteilmoitukset",
  "description": "Saat ilmoituksen kun saavutat välitavoitteen aktiviteetin aikana",
  "off": "Pois",
  "steps": "Askeleet",
  "duration": "Kesto",
  "distance": "Matka",
  "calories": "Kalorit",
  "everySteps": "Joka {{count}}",
  "everyMinutes": "Joka {{count}} min",
  "everyKm": "Joka {{count}} km",
  "everyCalories": "Joka {{count}}",
  "toastSteps": "{{count}} askelta!",
  "toastMinutes": "{{count}} min!",
  "toastKm": "{{count}} km!",
  "toastCalories": "{{count}} kal!"
}
```

---

## Audio Ducking — How It Works (Foreground Only)

The key line is:

```typescript
setAudioModeAsync({
  interruptionMode: "duckOthers",
  interruptionModeAndroid: "duckOthers",
});
```

This tells the OS: "when this app plays audio, lower the volume of other apps (Spotify, YouTube, etc.) instead of pausing them." After the short milestone sound finishes, the other app's volume returns to normal automatically. This is the same behavior the gym rest timer already uses.

**Note:** `setAudioModeAsync` is global — since `restTimerStore.ts` already calls it at module load time, both features share the same ducking mode. If the milestone hook loads first (activity session without gym), it needs to call `setAudioModeAsync` itself. The call is idempotent so calling it from both places is safe.

**Background notifications** use the system default notification sound (from the `milestone_alerts` channel), not the custom wav file. This is simpler and more reliable — the system handles audio interruption for notification sounds natively.

---

## Edge Cases

- **Multiple metrics cross at the same time**: Play the sound only once (not stacked). In foreground: one toast with multiple lines. In background: one notification with all milestones in the body text.
- **Paused session**: No alerts fire — `isActive` is false in the hook, `isPaused` is true in TimerService
- **Session reset/delete**: Thresholds reset to initial values in both hook and TimerService
- **Metric starts above first threshold** (e.g., session resumes with 1500 steps and interval is 1000): The `nextThreshold` initializes to the interval (1000), which is already below current steps. The first check will immediately advance it to 2000 without firing an alert. Handle this by initializing `nextThreshold` to `Math.ceil(currentValue / interval) * interval` when the hook first activates with existing metrics.
- **Very fast metric changes**: Metrics update at most once per second (interval-based), so multiple thresholds can't be skipped between checks
- **No GPS session** (steps/calories only, no distance): Distance milestones simply never fire since cumulative distance stays at 0
- **App transitions foreground ↔ background**: When returning to foreground, the hook reads `nextThresholds` directly from the native service (via `getMilestoneThresholds()`), NOT from current metrics. This avoids a race condition where metrics haven't been hydrated yet (steps/distance still at stale values), which would cause `Math.ceil` to set thresholds too low and re-fire already-notified milestones. The native service is always the source of truth.
- **TimerService killed by OS**: Unlikely since it's a foreground service with an ongoing notification. If killed, milestones stop until app is reopened (acceptable edge case).
- **Step sensor batching**: Android may batch step sensor events when screen is off. TimerService checks on each tick (1s), so even if sensor events arrive late, the next tick catches up.

---

## Verification

1. Build with `npx expo run:android`

### Settings
2. Navigate to Activities → Settings (gear icon)
3. Scroll down to "Milestone Alerts" section
4. Enable Steps → Every 500
5. Enable Duration → Every 5 min
6. Verify selections persist after closing and reopening settings

### Alert during session — foreground (steps)
7. Start a walking activity with steps enabled
8. Walk until step count reaches 500
9. Verify: short ding sound plays + phone vibrates + toast appears
10. Continue to 1000 — verify alert fires again
11. Verify alert does NOT fire between thresholds

### Alert during session — background (steps)
12. Start a walking activity with steps milestone (Every 500)
13. **Put phone in pocket / press home button** (app goes to background)
14. Walk until step count reaches 500
15. Verify: **Android notification appears** with sound + vibration, showing "500 steps!"
16. Continue walking — verify notification fires again at 1000
17. Open the app — verify the toast does NOT re-fire for already-notified milestones

### Alert during session — background (duration)
18. Start an activity with duration set to Every 5 min
19. Background the app
20. Wait 5 minutes — verify notification fires with "5 min!"
21. Verify it fires again at 10 minutes

### Audio ducking (foreground)
22. Play music in Spotify/YouTube Music
23. Start an activity with milestones enabled, keep app open
24. When a milestone fires, verify: music volume briefly lowers, sound plays, music returns to normal volume
25. Verify music does NOT pause or stop

### No double alerts
26. Start activity with steps (500), keep app in foreground
27. Hit 500 steps — verify toast + sound (foreground), NO Android notification
28. Background the app
29. Hit 1000 steps — verify Android notification, NO toast (app not visible)
30. Foreground the app
31. Hit 1500 steps — verify toast + sound again, NO notification

### Pause behavior
32. Pause the session — verify no alerts fire even if metrics were close to threshold (both foreground and background)
33. Resume — verify alerts resume normally

### Toast overlay (foreground)
34. Start an activity with steps milestone enabled (Every 500)
35. When 500 steps is reached — verify a toast appears at the top of the screen showing "500 steps!"
36. Verify the toast fades out after ~3-4 seconds
37. Verify the toast does NOT block touch events (can still tap buttons/map underneath)

### Multiple metrics
38. Enable both steps (500) and duration (5 min)
39. **Foreground**: If both cross at the same update — verify only one sound plays, and the toast shows both lines
40. **Background**: If both cross near the same time — verify one notification with both milestones in the text

### Distance milestone (GPS session, background)
41. Start a GPS activity (running/cycling) with distance milestone (Every 1 km)
42. Background the app
43. Move 1 km — verify notification fires with "1 km!"
44. Verify cumulative distance is tracked correctly across the session
