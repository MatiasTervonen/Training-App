# Gym Session Summary Stats

## Overview
Redesign the gym expanded card header to show a richer session summary with stat cards (similar to the activity session stats), replacing the current plain text layout.

## Current State
The gym expanded card header (`features/gym/cards/gym-expanded.tsx`) shows:
- Session title
- Clock icon + start time - end time
- "Duration: X h Y min"
- Notes (if present)

The `session_stats` table already gets a row for gym sessions — `gym_save_session` calls `activities_compute_session_stats`, which computes **calories** using `base_met * weight * (duration / 3600)`. However, no gym-specific stats (total volume, total sets, total exercises) are stored or displayed.

## Goal
Show a stat card grid in the gym expanded card header — the same `StatCard` pattern used in `features/activities/cards/activity-feed-expanded/components/sessionStats.tsx`.

## Stats to Display

| Stat | Source | Notes |
|------|--------|-------|
| **Duration** | `session.duration` | Already available |
| **Total Volume** | Computed: `SUM(weight * reps)` across all strength sets | New — needs computation |
| **Calories** | `session_stats.calories` | Already computed in DB via `activities_compute_session_stats` |
| **Exercises** | `COUNT(gym_session_exercises)` | Already in feed card `extra_fields`, easy to compute client-side |
| **Total Sets** | `COUNT(gym_sets)` | Already in feed card `extra_fields`, easy to compute client-side |
| **Muscle Groups Hit** | `COUNT(DISTINCT muscle_group)` from exercises | Compute client-side from exercise data |

## Design

### Header Layout
Keep the LinearGradient header but restructure:

```
[Date]
┌─────────────────────────────────────────┐
│            Session Title                 │
│     🕐 10:30 - 11:45                    │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Duration  │ │  Volume  │ │ Calories │ │
│  │  1h 15m   │ │ 12,500kg │ │   320    │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Exercises │ │   Sets   │ │ Muscles  │ │
│  │    6     │ │    24    │ │    4     │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                          │
│  Notes (if any)                          │
└─────────────────────────────────────────┘
```

### Stat Card Style
Reuse the same `StatCard` component from `features/activities/cards/activity-feed-expanded/components/sessionStats.tsx`. Extract it to a shared location (e.g. `components/StatCard.tsx`) so both gym and activity cards use it.

## Implementation

### 1. Add `total_volume` to `session_stats` table

New migration: add a `total_volume` column (numeric, nullable) to `session_stats`.

```sql
ALTER TABLE session_stats ADD COLUMN total_volume numeric;
```

### 2. Compute `total_volume` in `gym_save_session` RPC

After inserting exercises/sets and before calling `activities_compute_session_stats`, compute:

```sql
v_total_volume := (
  SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
  FROM jsonb_array_elements(p_exercises) AS e,
       jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
  WHERE (s->>'weight') IS NOT NULL
    AND (s->>'reps') IS NOT NULL
);
```

Then either:
- Pass it to `activities_compute_session_stats` (add a parameter), or
- Update `session_stats` after the compute call: `UPDATE session_stats SET total_volume = v_total_volume WHERE session_id = v_session_id`

The simpler approach is the UPDATE after, since `activities_compute_session_stats` already inserts the row.

### 3. Same for `gym_edit_session` RPC

Recompute total volume on edit and update `session_stats.total_volume`.

### 4. Backfill existing sessions

Migration to backfill `total_volume` for existing gym sessions:

```sql
UPDATE session_stats ss
SET total_volume = sub.vol
FROM (
  SELECT gse.session_id, coalesce(sum(gs.weight * gs.reps), 0) AS vol
  FROM gym_session_exercises gse
  JOIN gym_sets gs ON gs.session_exercise_id = gse.id
  WHERE gs.weight IS NOT NULL AND gs.reps IS NOT NULL
  GROUP BY gse.session_id
) sub
WHERE ss.session_id = sub.session_id;
```

### 5. Update `get-full-gym-session.ts` query

Include `session_stats` in the Supabase select:

```ts
.select(`
  *,
  session_stats(*),
  gym_session_exercises(
    *,
    gym_exercises(*, gym_exercises_translations!inner(name)),
    gym_sets(*)
  )
`)
```

### 6. Extract shared `StatCard` component

Move the `StatCard` from the activity session stats to `components/StatCard.tsx` so both gym and activity expanded cards can use it.

### 7. Update `gym-expanded.tsx`

- Import `StatCard`
- Compute client-side stats from the exercise data:
  - `exerciseCount` = `gym_session_exercises.length`
  - `totalSets` = sum of all `gym_sets` arrays
  - `muscleGroupsHit` = count of distinct `muscle_group` values
- Read from `session_stats`:
  - `calories`
  - `total_volume`
- Render two rows of 3 stat cards between the time and notes

### 8. Add translations

Add to `locales/*/gym.json`:
- `gym.session.totalVolume`
- `gym.session.calories`
- `gym.session.exercises`
- `gym.session.totalSets`
- `gym.session.muscleGroups`

### 9. Format volume with user's weight unit

Use the user's `weight_unit` preference (kg/lbs) when displaying total volume — it should match the unit used in the sets.

## Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_gym_session_stats.sql` | Add `total_volume` column + backfill |
| `supabase/migrations/YYYYMMDD_update_gym_save.sql` | Update `gym_save_session` to compute + store total volume |
| `supabase/migrations/YYYYMMDD_update_gym_edit.sql` | Update `gym_edit_session` to recompute total volume |
| `mobile/types/database.types.ts` | Regenerate (adds `total_volume` to `session_stats`) |
| `mobile/database/gym/get-full-gym-session.ts` | Add `session_stats(*)` to select |
| `mobile/components/StatCard.tsx` | Extract from activity stats → shared component |
| `mobile/features/activities/.../sessionStats.tsx` | Import shared `StatCard` instead of local |
| `mobile/features/gym/cards/gym-expanded.tsx` | Add stat cards grid to header |
| `mobile/locales/en/gym.json` | New translation keys |
| `mobile/locales/fi/gym.json` | New translation keys |

## Edge Cases
- Sessions with only cardio exercises: total volume = 0 → show "0" or hide the volume card
- Sessions with no sets at all: show "0" for all numeric stats
- Old sessions without `session_stats` row: show "—" or compute on the fly
- Weight unit conversion: volume is stored in the unit used during the session (whatever the user had set)
