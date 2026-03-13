# Step-Based Distance Estimation

## Overview

Add live distance estimation calculated from step count when GPS is not available. This applies to two contexts:

1. **Activity sessions** started without GPS tracking
2. **Gym warmup/cooldown** phases in live tracking mode

The formula is simple: `distance = steps × strideLength`. Stride length is derived from user height, or falls back to a sensible default.

---

## Current State

### Activity Relevance Flags (already implemented)

Activities in the database have three boolean flags that control which stats are shown:
- `is_gps_relevant` — controls whether GPS toggle is shown pre-session
- `is_step_relevant` — controls whether steps are displayed during live tracking
- `is_calories_relevant` — controls whether calories are displayed during live tracking

These flags are loaded when the user selects an activity and flow through to both `SessionStats` (activity sessions) and `PhaseCard` (gym phases). Non-step activities (cycling, swimming, etc.) have `is_step_relevant = false`, which automatically hides the steps row — and should also hide step-based distance.

### Activity Sessions (non-GPS mode)

- **Screen:** `app/activities/start-activity/index.tsx`
- **Stats component:** `features/activities/components/sessionStats.tsx`
- **Live metrics shown:** Timer, Steps (if `isStepRelevant`), Calories (if `isCaloriesRelevant`)
- **Distance:** Not shown — only available in GPS mode via haversine on track points
- **Steps source:** `useLiveStepCounter` hook → native Android step sensor

### Gym Warmup/Cooldown (live tracking mode)

- **Form:** `features/gym/components/GymForm.tsx`
- **Phase card:** `features/gym/components/PhaseCard.tsx`
- **Live tracking hook:** `features/gym/hooks/usePhaseTracking.ts`
- **Live metrics shown:** Timer, Steps (if `isStepRelevant`), Calories (if `isCaloriesRelevant`)
- **Distance:** Not shown during live tracking. `distance_meters` field exists in `PhaseData` but is only populated via manual entry.
- **Steps source:** Same native Android step sensor via `NativeStepCounter`

### User Profile

- **No height stored** — profile currently has: name, weight, distance unit, weight unit
- **Weight is stored** in the `weight` table (used for calorie calculation)

---

## Design

### Stride Length Estimation

Use height-based stride length formulas. These are widely used in fitness apps (Fitbit, Garmin, etc.):

| Activity Type | Formula | Default (no height) |
|---------------|---------|---------------------|
| Walking | `height_cm × 0.414` | 72 cm (for ~174cm person) |
| Running | `height_cm × 0.45` | 78 cm |
| Hiking | `height_cm × 0.414` | 72 cm (same as walking) |
| Other | `height_cm × 0.414` | 72 cm (walking fallback) |

**Activity type detection:**
- Activities have a `slug` field (e.g., "walking", "running", "cycling", "hiking") used to determine stride length (walking vs running multiplier)
- The `is_step_relevant` flag (already implemented) controls whether step-based distance is shown — no separate filtering needed

### Which activities should show step-based distance?

Show step-based distance whenever `isStepRelevant` is true and GPS is not active. The `is_step_relevant` flag already filters out non-step activities (cycling, swimming, etc.), so no additional logic is needed. Use the activity `slug` only to pick the correct stride multiplier (running vs walking).

---

## Changes Required

### 1. Add Height to User Profile

**New DB migration:** Add `height_cm` column to profile or create a height record similar to weight.

Option A (simpler): Add a `height` table mirroring the `weight` table pattern.
Option B (simplest): Add `height_cm NUMERIC` column to `user_settings` table.

**Go with Option B** — height doesn't change frequently like weight, so a simple column is fine.

**Profile UI update:** `app/menu/profile/index.tsx`
- Add height input field (with cm/ft-in unit toggle matching existing unit preference patterns)
- Store as cm in database, display in user's preferred unit

**Onboarding:** Optionally add height to the weight onboarding screen. Low priority — the default stride length works fine without it.

### 2. Create Stride Length Utility

**New file:** `features/activities/lib/strideLength.ts`

```typescript
type MovementType = "walking" | "running";

function getStrideLength(heightCm: number | null, movementType: MovementType): number {
  const defaults = { walking: 0.72, running: 0.78 }; // meters
  if (!heightCm) return defaults[movementType];

  const multiplier = movementType === "running" ? 0.0045 : 0.00414;
  return heightCm * multiplier; // returns meters
}

function getDistanceFromSteps(steps: number, strideLengthMeters: number): number {
  return steps * strideLengthMeters; // returns meters
}
```

### 3. Create `useStepDistance` Hook

**New file:** `features/activities/hooks/useStepDistance.ts`

A simple hook that takes live step count and returns estimated distance:

```typescript
function useStepDistance(steps: number, heightCm: number | null, activitySlug: string | null): number {
  // Determine if running or walking based on activity slug
  // Return distance in meters
}
```

This hook can be shared between activity sessions and gym phases.

### 4. Update Activity Session (Non-GPS Mode)

**File:** `features/activities/components/sessionStats.tsx`

- Accept `estimatedDistance` prop (meters)
- When `isStepRelevant && estimatedDistance > 0`, show distance row below steps
- Format as km or mi based on user's distance unit preference
- Show with `~` prefix to indicate estimate (e.g., `~2.3 km`)
- Use a slightly muted style or a small "est." label to differentiate from GPS distance

**File:** `app/activities/start-activity/index.tsx`

- Compute step-based distance using `useStepDistance(steps, userHeight, activitySlug)`
- Pass to `SessionStats` component
- Only compute when `!allowGPS && isStepRelevant && stepsAllowed`

### 5. Update Gym Phase Card (Live Mode)

**File:** `features/gym/components/PhaseCard.tsx`

- In `"live"` mode, show estimated distance below steps (only when `isStepRelevant`)
- Accept pre-computed `estimatedDistance` prop
- Format same as activity session (with `~` prefix)

**File:** `features/gym/hooks/usePhaseTracking.ts`

- Add distance calculation to the tracking hook
- Return `distance_meters` alongside `steps` and `duration_seconds` when stopping
- This way the distance gets saved to `gym_session_phases.distance_meters` automatically

### 6. Save Step-Based Distance

#### Activity Sessions

**File:** `features/activities/hooks/useSaveSession.ts`

- When saving a non-GPS session, compute final distance from final step count
- Pass `distance_meters` to the save RPC
- The `activities_compute_session_stats` RPC already handles `distance` — but currently only from GPS. Need to check if it overwrites the passed distance or only computes from track points.

**RPC update (if needed):** If the RPC currently only calculates distance from GPS track points, update it to accept and use `p_distance_meters` when no GPS track is provided. This way step-based distance is stored in `session_stats`.

#### Gym Sessions

- Already handled — `PhaseData.distance_meters` flows through `useSaveSession` → `gym_save_session` RPC → `gym_session_phases.distance_meters`
- Just need to populate it from the tracking hook

### 7. Display in Session History / Share Cards

**Low priority / future scope.** Once distance is saved in the database, it will naturally appear wherever session stats are displayed. No immediate changes needed unless the share card specifically hides distance for non-GPS sessions.

---

## UI Mockup (Non-GPS Session Stats)

Current:
```
        05:23          ← timer (large)
     🦶 1,247          ← steps
     🔥 89 kcal        ← calories
```

After:
```
        05:23          ← timer (large)
     🦶 1,247          ← steps
     📏 ~0.9 km        ← estimated distance (new)
     🔥 89 kcal        ← calories
```

## UI Mockup (Gym Phase Card - Live Mode)

Current:
```
  Warm-up: Walking          [Stop]
  ⏱ 03:22    👟 412    🔥 18 kcal
```

After (2×2 grid):
```
  Warm-up: Walking          [Stop]
  ⏱ 03:22       👟 412
  📏 ~0.3 km    🔥 18 kcal
```

---

## Implementation Order

1. **Stride length utility** — pure function, no dependencies
2. **`useStepDistance` hook** — wraps the utility with user height from DB
3. **Activity session non-GPS display** — show live distance in `SessionStats`
4. **Gym phase live tracking** — show distance in `PhaseCard`, return on stop
5. **Save distance to DB** — ensure it persists for both activity sessions and gym phases
6. **Height in profile** — add to user settings table + profile UI
7. **Unit formatting** — respect km/mi preference for step-based distance display

Steps 1-5 work with default stride length (no height needed). Step 6-7 improve accuracy but are not blockers.

---

## Edge Cases

- **No steps sensor:** Don't show distance (same as current — steps row is hidden)
- **No height set:** Use default stride lengths (72cm walking, 78cm running)
- **Activity slug unknown:** Default to walking stride
- **Steps = 0:** Don't show distance row (or show `~0.0 km`)
- **`is_step_relevant = false`:** Don't show step-based distance — already handled by existing relevance flag filtering
- **User switches from GPS to non-GPS mid-session:** Not currently possible (toggle is locked after start), so not a concern.

## Not In Scope

- GPS distance + step distance hybrid (using steps to fill GPS gaps)
- Stride length calibration from GPS data
- Per-activity stride length customization
- Treadmill speed/incline integration
