# Gym Warm-up & Cool-down Phases

## Context

During gym workouts, users commonly do cardio warm-ups (treadmill walk, stationary bike) before lifting and cool-downs after. Currently the gym session only has exercise cards with time/distance fields for cardio-type exercises, but there's no dedicated warm-up or cool-down tracking.

The app already has a full activity session system with step counting, MET-based calorie calculation, and optional GPS tracking. The activity system supports a "no location tracking" mode which still counts steps — perfect for indoor treadmill use.

### Current Calorie Calculation

Gym sessions compute calories as:
```
calories = gym_base_met * weight_kg * (total_duration / 3600)
```

This treats the entire session duration as gym time, including any warm-up/cool-down the user did. This leads to inaccurate calorie estimates because a 10-minute treadmill walk has a different MET value than lifting weights.

## Goal

Add warm-up and cool-down phases to gym sessions that:
1. Reuse the existing activity infrastructure (step counter, activity types, MET values)
2. Track time, steps, and distance for each phase
3. Calculate calories separately for each phase using the correct MET value
4. Exclude phase time from gym calorie calculation to avoid double counting

## Design

### Position & Behavior

- **Warm-up**: always pinned at the top of the exercise list, before all exercises
- **Cool-down**: always pinned at the bottom, after all exercises
- **Not draggable** — position is fixed. Exercises between them remain draggable as before
- **Collapsible** — auto-collapses after stopping. User can tap to expand/edit

### How to Add — Via Existing Exercise Selector

No separate buttons. Warm-up and cool-down are added through the existing "Add Exercise" button, which opens the exercise selector SectionList. A new section is added at the top:

```
┌─────────────────────────────┐
│  Search exercises...        │
│                             │
│  ── Warm-up / Cool-down ──  │
│  Add Warm-up                │
│  Add Cool-down              │
│                             │
│  ── Recent ───────────────  │
│  Bench Press                │
│  Squats                     │
│  ...                        │
│                             │
│  ── All exercises ────────  │
│  ...                        │
└─────────────────────────────┘
```

- Section appears at the top of the SectionList, before the "Recent" section
- Once a warm-up is added, that row disappears (or shows greyed out). Same for cool-down
- If both are added, the entire section is hidden
- Only one warm-up and one cool-down per session

When the user taps "Add Warm-up" or "Add Cool-down":

1. **Activity picker** — modal/bottom sheet showing activity types from the `activities` table (Walking, Running, Cycling, Elliptical, etc.)
2. **Input mode choice** — "Track live" or "Enter manually"

### How Other Apps Handle This

For reference, here's how popular gym apps approach warm-up/cool-down:

- **Hevy / Strong**: Treat warm-up as a **set type** (warm-up, normal, drop set, failure). They have warm-up set calculators that suggest percentage-based warm-up sets for lifts. No dedicated cardio warm-up tracking.
- **Fitbod**: Auto-generates warm-up and cool-down routines as **separate sections** added to each workout. Duration is calculated as 10% of workout time (max 10 min). Warm-up time is excluded from workout duration.
- **JEFIT**: Includes cardio exercises alongside strength exercises — no special warm-up phase.

Our approach combines the best of these: a dedicated phase (like Fitbod) that uses real activity tracking (steps, MET-based calories) and integrates into the existing exercise flow (like JEFIT) rather than being a separate screen.

### Phase Card UI

#### Live Tracking Mode

```
┌──────────────────────────────────────┐
│ Warm-up: Treadmill Walk              │
│                                      │
│   ⏱ 08:32      👟 1,024 steps       │
│                                      │
│   [Stop]                             │
└──────────────────────────────────────┘
```

- Starts step counter via `startStepSession()` + `startLiveStepUpdates()` (reuses existing native step counter)
- No GPS tracking (indoor)
- Timer runs independently from the gym session timer (gym timer keeps running)
- User taps "Stop" to end tracking — card auto-collapses
- Final step count retrieved via `getSessionSteps()`

#### Manual Entry Mode

```
┌──────────────────────────────────────┐
│ Warm-up: Stationary Bike             │
│                                      │
│   Time (min)     Distance (km)       │
│   ┌──────────┐   ┌──────────┐       │
│   │ 10       │   │ 3.2      │       │
│   └──────────┘   └──────────┘       │
│                                      │
│   Steps (optional)                   │
│   ┌──────────┐                       │
│   │          │                       │
│   └──────────┘                       │
│                                      │
│   [Save]                             │
└──────────────────────────────────────┘
```

- Time (minutes) — required
- Distance — optional
- Steps — optional (useful for treadmill when user didn't use live tracking)
- After saving, card auto-collapses

#### Collapsed State

```
┌──────────────────────────────────────┐
│ ▶ Warm-up: Treadmill · 10min · 1,200 steps     [✕]  │
└──────────────────────────────────────┘
```

- Tap to expand and view/edit details
- X button to remove the phase entirely
- Shows activity name, duration, and steps (or distance if no steps)

### Phase During Active Session

When a live warm-up/cool-down is running, the GymForm sticky timer bar shows it:

```
┌──────────────────────────────────────────┐
│  00:45 ⏸  │  Warm-up: 03:22  👟 412     │
└──────────────────────────────────────────┘
```

This way the user can scroll through exercises while the warm-up timer is visible at the top.

## Calorie Calculation (No Double Counting)

### Formula

```
warmup_calories   = warmup_activity_met  * weight_kg * (warmup_seconds / 3600)
cooldown_calories = cooldown_activity_met * weight_kg * (cooldown_seconds / 3600)
lifting_seconds   = total_session_duration - warmup_seconds - cooldown_seconds
gym_calories      = gym_base_met * weight_kg * (lifting_seconds / 3600)
total_calories    = gym_calories + warmup_calories + cooldown_calories
```

Each phase uses the MET value from the selected activity type (e.g. walking ~3.5, cycling ~6.0), while the lifting portion uses the gym MET value (~5.0). The warm-up/cool-down time is subtracted from total duration before computing gym calories.

### Where It Happens

Modify `activities_compute_session_stats` (or `gym_save_session`) to:
1. Query `gym_session_phases` for the session
2. Sum up phase durations
3. Compute phase calories using each phase's activity MET
4. Compute gym calories using remaining time
5. Store total in `session_stats.calories`

## Template Support

Templates should support warm-up and cool-down phases so users don't have to re-add them every session.

### How It Works

- When creating/editing a template, the same exercise selector SectionList is used — including the "Warm-up / Cool-down" section at the top
- Template phases only store: phase type + activity type. No time, distance, or step values — just like exercises in templates have no sets/reps
- When loading a template, the phase card appears with the activity pre-selected and the user chooses input mode (live / manual) and enters values during the session

### Template Phase Card (in template editor)

Just a simple card showing the selected activity, same as how exercises show just the exercise name:

```
┌──────────────────────────────────────┐
│ Warm-up: Treadmill Walk         [✕]  │
└──────────────────────────────────────┘
```

No input fields. When the session starts from this template, the user gets the phase card with activity pre-selected and chooses how to track it.

## Database Changes

### New Table: `gym_template_phases`

```sql
CREATE TABLE gym_template_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES gym_templates(id) ON DELETE CASCADE,
  phase_type      TEXT NOT NULL CHECK (phase_type IN ('warmup', 'cooldown')),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  user_id         UUID NOT NULL DEFAULT auth.uid(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_template_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own template phases"
  ON gym_template_phases FOR ALL
  USING (user_id = auth.uid());
```

### New Table: `gym_session_phases`

```sql
CREATE TABLE gym_session_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phase_type      TEXT NOT NULL CHECK (phase_type IN ('warmup', 'cooldown')),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  duration_seconds INTEGER NOT NULL,
  steps           INTEGER,
  distance_meters NUMERIC,
  calories        NUMERIC,
  is_manual       BOOLEAN DEFAULT false,
  user_id         UUID NOT NULL DEFAULT auth.uid(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gym_session_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phases"
  ON gym_session_phases FOR ALL
  USING (user_id = auth.uid());
```

### Modify `gym_save_session` RPC

Add parameter `p_phases jsonb DEFAULT '[]'::jsonb` containing:

```json
[
  {
    "phase_type": "warmup",
    "activity_id": "uuid",
    "duration_seconds": 600,
    "steps": 1200,
    "distance_meters": 800,
    "is_manual": false
  }
]
```

After inserting exercises/sets, insert phases and compute per-phase calories:

```sql
FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases) LOOP
  v_phase_met := (SELECT base_met FROM activities WHERE id = (v_phase->>'activity_id')::uuid);
  v_phase_calories := v_phase_met * v_weight * ((v_phase->>'duration_seconds')::integer / 3600.0);
  v_total_phase_seconds := v_total_phase_seconds + (v_phase->>'duration_seconds')::integer;

  INSERT INTO gym_session_phases (session_id, phase_type, activity_id, duration_seconds, steps, distance_meters, calories, is_manual, user_id)
  VALUES (v_session_id, v_phase->>'phase_type', (v_phase->>'activity_id')::uuid,
          (v_phase->>'duration_seconds')::integer, (v_phase->>'steps')::integer,
          (v_phase->>'distance_meters')::numeric, v_phase_calories,
          (v_phase->>'is_manual')::boolean, auth.uid());
END LOOP;
```

Then adjust gym calorie calculation:

```sql
v_lifting_seconds := p_duration - v_total_phase_seconds;
v_gym_calories := v_gym_met * v_weight * (v_lifting_seconds / 3600.0);
v_total_calories := v_gym_calories + v_total_phase_calories;
-- Store v_total_calories in session_stats.calories
```

### Modify `gym_edit_session` RPC

Same logic — delete existing phases, re-insert from `p_phases`, recompute calories.

### Modify `get-full-gym-session.ts`

Include phases in the Supabase select:

```ts
.select(`
  *,
  session_stats(*),
  gym_session_phases(*, activities(name, slug, base_met)),
  gym_session_exercises(
    *,
    gym_exercises(*, gym_exercises_translations!inner(name)),
    gym_sets(*)
  )
`)
```

## Files to Create

| File | Purpose |
|------|---------|
| `features/gym/components/PhaseCard.tsx` | Warm-up/cool-down card component (expanded + collapsed states) |
| `features/gym/components/PhaseActivityPicker.tsx` | Activity type selector modal for phases |
| `features/gym/hooks/usePhaseTracking.ts` | Live step tracking for phases (wraps existing step counter hooks) |
| `supabase/migrations/YYYYMMDDHHmmss_gym_session_phases.sql` | New tables (`gym_session_phases` + `gym_template_phases`) + RLS |
| `supabase/migrations/YYYYMMDDHHmmss_update_gym_save_with_phases.sql` | Update save/edit RPCs |

## Files to Modify

| File | Change |
|------|--------|
| `features/gym/components/GymForm.tsx` | Render PhaseCard above/below exercises based on phase state |
| `features/gym/components/ExerciseSelectorList.tsx` | Add "Warm-up / Cool-down" section at top of SectionList |
| `features/gym/hooks/useSaveSession.ts` | Include phase data in save payload |
| `database/gym/save-session.ts` | Pass phases to RPC |
| `database/gym/get-full-gym-session.ts` | Include `gym_session_phases` in select |
| `types/database.types.ts` | Regenerate (adds `gym_session_phases` + `gym_template_phases`) |
| `types/session.ts` | Add phase types to session types |
| `features/gym/cards/gym-expanded.tsx` | Show warm-up/cool-down in session detail view |
| `app/gym/training-finished/index.tsx` | Show phases in share card summary |
| Template editor (create/edit template) | Add phase support using same exercise selector + PhaseCard |
| Template loading logic | Load `gym_template_phases` and populate phase state when starting from template |
| `locales/en/gym.json` | New translation keys |
| `locales/fi/gym.json` | New translation keys |

## Translations

### `locales/en/gym.json`

```json
"phase": {
  "warmup": "Warm-up",
  "cooldown": "Cool-down",
  "addWarmup": "Add Warm-up",
  "addCooldown": "Add Cool-down",
  "trackLive": "Track live",
  "enterManually": "Enter manually",
  "selectActivity": "Select activity",
  "timeMin": "Time (min)",
  "distance": "Distance",
  "steps": "Steps (optional)",
  "stop": "Stop",
  "save": "Save",
  "remove": "Remove"
}
```

### `locales/fi/gym.json`

```json
"phase": {
  "warmup": "Lämmittely",
  "cooldown": "Jäähdyttely",
  "addWarmup": "Lisää lämmittely",
  "addCooldown": "Lisää jäähdyttely",
  "trackLive": "Seuraa livenä",
  "enterManually": "Syötä käsin",
  "selectActivity": "Valitse aktiviteetti",
  "timeMin": "Aika (min)",
  "distance": "Matka",
  "steps": "Askeleet (valinnainen)",
  "stop": "Lopeta",
  "save": "Tallenna",
  "remove": "Poista"
}
```

In the expanded gym card, show phase info above and below the exercise list, matching the collapsed card style.

## Edge Cases

| Case | Handling |
|------|----------|
| Manual phase time exceeds session duration | Validate — don't allow manual time entry that exceeds remaining session time |
| No steps for cycling/elliptical | Steps field is optional, show distance instead |
| User removes phase after tracking | Delete phase data, recalculate calories on save |
| Activity type has no MET value | Fall back to gym MET value |
| Edit existing session with phases | Load phases into PhaseCard, allow editing, recompute on save |
| Live tracking interrupted (app crash) | Phase is lost — user can re-add manually |
| Step counter not available (permissions) | Live tracking still works for time, steps show as 0 |
| Template with phase, activity type deleted | Skip the phase when loading template, don't crash |
| Search in exercise selector | Phase section hides when search query is active (only show exercises) |

## Verification

1. Build with `npx expo run:android`

### Exercise Selector Integration
2. Start a gym session → tap "Add Exercise"
3. Verify "Warm-up / Cool-down" section appears at top of SectionList, above "Recent"
4. Verify "Recent" and "All exercises" sections still appear below
5. Tap "Add Warm-up" → verify activity picker appears
6. Select "Walking" → choose "Track live"
7. Verify step counter starts, timer runs, steps increment
8. Verify gym session timer continues running independently
9. Tap "Stop" → verify card collapses showing summary
10. Open exercise selector again → verify "Add Warm-up" row is gone/greyed out, "Add Cool-down" still available

### Manual Entry
11. Tap "Add Cool-down" from exercise selector → select "Cycling" → choose "Enter manually"
12. Enter time: 10, distance: 3.2
13. Tap "Save" → verify card collapses
14. Open exercise selector again → verify entire "Warm-up / Cool-down" section is hidden

### Calorie Calculation
15. Save the session
16. Open session detail → verify calories breakdown shows separate warm-up/lifting/cool-down values
17. Verify total calories = sum of all three parts

### Position Lock
18. Start a new session with warm-up and exercises
19. Enter drag mode → verify warm-up card has no drag handle and stays at top
20. Verify exercises between warm-up and cool-down are still draggable

### Collapse/Expand
21. Tap collapsed warm-up card → verify it expands showing details
22. Tap again → verify it collapses

### Remove Phase
23. Tap X on a collapsed phase card → verify it's removed
24. Open exercise selector → verify "Add Warm-up" row reappears in the section

### Templates
25. Create a new template → tap "Add Exercise"
26. Verify "Warm-up / Cool-down" section appears in exercise selector
27. Add a warm-up → select activity type (e.g. Walking)
28. Verify template shows simple card with just activity name, no input fields
29. Save the template
30. Start a session from that template → verify warm-up phase card appears with activity pre-selected
31. Verify user is prompted to choose input mode (live / manual)

### Edit Session
31. Open a saved session with phases → tap edit
32. Verify phases load correctly and can be modified
33. Save → verify recalculated calories

### Share Card
34. Save a session with warm-up + cool-down
35. On training-finished screen, verify phases appear in the summary
