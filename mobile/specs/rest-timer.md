# Gym Rest Timer

## Context
During gym workouts, rest periods between sets are important for recovery. Currently the user has to manually track rest time. This feature adds an automatic rest timer that starts when the user logs a set, counts down the configured duration, and plays a short sound when rest is over.

## Requirements
- **Auto-start**: Rest timer starts automatically when user taps "Add Set"
- **Short sound**: Play a brief ding/bell when timer finishes — NOT a full looping alarm
- **Background notification**: Show a countdown notification when phone is locked or app is in background
- **Configurable duration**: Free text input in seconds, default 90s
- **Enable/disable toggle**: Off by default, user enables it in Gym Settings
- **Skip/dismiss**: User can skip the rest timer at any time
- **Non-destructive**: Must not interfere with the session duration timer that already runs during workouts

## How It Works

### Timer Flow
1. User taps "Add Set" on any exercise → `logSetForExercise()` fires
2. If rest timer is enabled in settings, start a countdown of N seconds
3. Show countdown in the sticky timer bar at top of GymForm (next to session timer)
4. Schedule an `expo-notifications` notification at `endTimestamp` (for background)
5. When countdown reaches 0:
   - **Foreground**: Play short ding sound via `expo-audio`, briefly highlight the rest timer text
   - **Background**: Notification fires with default notification sound
6. If user taps "Add Set" again before timer finishes → restart the timer (new rest period)
7. If user taps "Skip" → cancel timer and notification immediately
8. When session is saved/ended → cancel any running rest timer

### Timer Bar Layout (GymForm sticky bar)
Current bar (line 256 of GymForm.tsx) shows only the session timer.
New layout when rest timer is active:

```
┌──────────────────────────────────────┐
│  00:45 ⏸  │  Rest: 01:12  ✕         │
│  (session)   (rest countdown)(skip)  │
└──────────────────────────────────────┘
```

When rest timer is not active, the bar looks the same as it does now (only session timer).

---

## Files to Create

### 1. `lib/stores/restTimerStore.ts` — Rest Timer State

New Zustand store (separate from `timerStore` which handles session duration).

```typescript
interface RestTimerState {
  isRunning: boolean;
  endTimestamp: number | null;
  uiTick: number;

  startRestTimer: (durationSeconds: number) => void;
  skipRestTimer: () => void;
  clearRestTimer: () => void;
}
```

**Implementation details:**
- Uses `setInterval` (1s) to increment `uiTick` for UI re-renders
- When `Date.now() >= endTimestamp`: set `isRunning = false`, play sound, clear interval
- On `startRestTimer`: if already running, clear old interval and restart
- On `skipRestTimer`: clear interval, cancel scheduled notification, reset state
- On `clearRestTimer`: same as skip but used for session end cleanup
- NO AsyncStorage persistence needed — rest timer is ephemeral (resets on app restart)
- Schedule `expo-notifications` notification at `endTimestamp` on start, cancel on skip

### 2. `lib/stores/gymSettingsStore.ts` — Gym Settings State

New Zustand store with AsyncStorage persistence for gym-specific settings.

```typescript
interface GymSettings {
  restTimerEnabled: boolean;      // default: false
  restTimerDurationSeconds: number; // default: 90
}

interface GymSettingsStore extends GymSettings {
  setRestTimerEnabled: (enabled: boolean) => void;
  setRestTimerDuration: (seconds: number) => void;
}
```

**Implementation details:**
- Zustand + `persist` middleware with AsyncStorage (key: `"gym-settings-store"`)
- Follow the same pattern as `useUserStore.ts`
- Local-only storage, no Supabase sync needed

### 3. `features/gym/components/RestTimerDisplay.tsx` — Timer UI

Component shown in the GymForm sticky bar when rest timer is active.

```typescript
// Shows: "Rest: MM:SS" + skip button (X icon)
// Reads from restTimerStore (isRunning, endTimestamp, uiTick)
// Formats remaining seconds as MM:SS
// Skip button calls skipRestTimer()
```

**Styling:**
- Use `AppText` with a distinct color (e.g., amber/yellow) to differentiate from session timer
- Skip button: `X` icon from `lucide-react-native`, small hitSlop
- Uses NativeWind `className` for all styling

### 4. `features/gym/hooks/useRestTimerSound.ts` — Sound Hook

Hook that listens to rest timer completion and plays a short sound.

```typescript
// Uses expo-audio (already installed: ~1.0.13)
// Loads a short bell/ding sound asset on mount
// When restTimerStore.isRunning transitions from true → false AND endTimestamp was reached:
//   play the sound once
// Cleanup: unload audio on unmount
```

### 5. `assets/audio/rest-timer-ding.mp3` — Short Sound Asset

A brief (1-2 second) bell/ding sound file. Can use any royalty-free short notification sound.

### 6. `app/gym/settings/index.tsx` — Gym Settings Page

New settings page under the gym section (not global settings).

```
┌─────────────────────────────┐
│       Gym Settings          │
│                             │
│  Rest Timer                 │
│  ┌─────────────────────┐   │
│  │ Enable rest timer  ○ │   │  ← toggle switch
│  └─────────────────────┘   │
│                             │
│  Rest duration (seconds)    │
│  ┌─────────────────────┐   │
│  │ 90                   │   │  ← numeric input
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Implementation details:**
- Wrap with `ModalPageWrapper`
- Use `AppText` for labels
- Use `AppInput` with `keyboardType="numeric"` for duration
- Use a toggle/switch component for enable/disable
- Read/write from `gymSettingsStore`
- Duration input: only allow numbers, validate > 0

### 7. `app/gym/settings/_layout.tsx` — Layout for Gym Settings

Expo Router layout file for the gym settings route group.

---

## Files to Modify

### 1. `features/gym/hooks/useLogSetForExercise.ts`

**Change:** After logging a set, trigger the rest timer.

```typescript
// At the end of logSetForExercise(), after setExercises(updated):
const { restTimerEnabled, restTimerDurationSeconds } = useGymSettingsStore.getState();
if (restTimerEnabled) {
  useRestTimerStore.getState().startRestTimer(restTimerDurationSeconds);
}
```

### 2. `features/gym/components/GymForm.tsx`

**Change 1:** Import and render `RestTimerDisplay` in the sticky timer bar (line 256).

```tsx
// Before (line 256-265):
<View className="flex items-center bg-gray-600 p-2 px-4 w-full z-40 sticky top-0">
  <Timer textClassName="text-xl" manualSession={{...}} />
</View>

// After:
<View className="flex-row items-center justify-center bg-gray-600 p-2 px-4 w-full z-40 sticky top-0">
  <Timer textClassName="text-xl" manualSession={{...}} />
  <RestTimerDisplay />
</View>
```

**Change 2:** Mount `useRestTimerSound` hook for sound playback.

**Change 3:** In `useSaveSession` / session end flow, call `clearRestTimer()` to clean up.

### 3. `features/gym/hooks/useSaveSession.ts`

**Change:** Clear rest timer when session is saved.

```typescript
// In handleSaveSession, before or after resetSession():
useRestTimerStore.getState().clearRestTimer();
```

### 4. `app/gym/index.tsx`

**Change:** Add a navigation link to the Gym Settings page on the gym front page.

```tsx
// Add after the last divider/button section:
<View className="border border-gray-400 rounded-md" />
<LinkButton label={t("gym.settings.title")} href="/gym/settings">
  <Settings color="#f3f4f6" className="ml-2" />
</LinkButton>
```

Import `Settings` from `lucide-react-native`.

### 5. `locales/en/gym.json`

**Add** under `"gym"`:

```json
"restTimer": {
  "label": "Rest",
  "skip": "Skip",
  "finished": "Rest time is up!"
},
"settings": {
  "title": "Gym Settings",
  "restTimerEnabled": "Enable rest timer",
  "restTimerDuration": "Rest duration (seconds)",
  "restTimerDescription": "Automatically start a rest timer when you log a set"
}
```

### 6. `locales/fi/gym.json`

**Add** under `"gym"`:

```json
"restTimer": {
  "label": "Lepo",
  "skip": "Ohita",
  "finished": "Lepoaika päättyi!"
},
"settings": {
  "title": "Kuntosaliasetukset",
  "restTimerEnabled": "Lepotimer käytössä",
  "restTimerDuration": "Lepoaika (sekuntia)",
  "restTimerDescription": "Käynnistä lepotimer automaattisesti kun kirjaat sarjan"
}
```

---

## Notification Details

Use `expo-notifications` (already configured in the project) to schedule a simple timed notification:

```typescript
import * as Notifications from "expo-notifications";

// On rest timer start:
await Notifications.scheduleNotificationAsync({
  content: {
    title: t("gym.restTimer.finished"),
    sound: true, // uses default notification sound (short)
  },
  trigger: {
    type: SchedulableTriggerInputTypes.DATE,
    date: new Date(endTimestamp),
  },
});

// On skip/clear: cancel the scheduled notification
await Notifications.cancelScheduledNotificationAsync(notificationId);
```

This approach:
- Does NOT conflict with the native `TimerService` (used by session timer)
- Uses the default Android notification sound (short ding) — exactly what the user wants
- Works when app is in background or phone is locked
- Is simple to implement with existing infrastructure

---

## Verification

1. Build with `npx expo run:android`

### Settings
2. Navigate to Gym → Gym Settings (link at bottom of gym front page)
3. Verify toggle and duration input work
4. Set duration to 10 seconds for testing, enable the timer

### Timer auto-start
5. Start a gym workout, add an exercise
6. Log a set → verify rest timer countdown appears in the top bar next to session timer
7. Verify the session timer keeps running independently

### Timer completion (foreground)
8. Wait for the 10-second countdown to reach 0
9. Verify a short ding sound plays
10. Verify the rest timer display disappears from the bar

### Skip
11. Log another set, then immediately tap the skip (X) button
12. Verify the timer stops and disappears

### Timer restart
13. Log a set, wait 5 seconds, log another set
14. Verify the rest timer restarts from the full duration

### Background notification
15. Log a set, then lock the phone or switch to another app
16. Wait for the timer to finish
17. Verify a notification appears with a short sound

### Session end cleanup
18. Log a set (timer starts), then save the session
19. Verify no orphaned timer or notification remains
