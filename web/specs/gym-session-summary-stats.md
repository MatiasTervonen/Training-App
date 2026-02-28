# Gym Session Summary Stats (Web)

## Overview
Add a stat card grid to the gym expanded card header, showing session summary stats (duration, total volume, calories, exercises, total sets, muscle groups hit). Mirrors the mobile implementation and follows the same `StatCard` pattern already used in the activity session stats.

## Current State
The gym expanded card (`features/gym/cards/gym-expanded.tsx`) shows:
- Session title
- Clock icon + start time – end time
- "Duration: X h Y min"
- Notes (if present)

The `session_stats` table already has a `total_volume` column (added in migration `20260226100000`), and the `gym_save_session` / `gym_edit_session` RPCs already compute and store it. Calories are also already computed via `activities_compute_session_stats`. **No new DB migrations are needed.**

## Goal
Show a 2-row, 3-column stat card grid inside the gym expanded card header — reusing the `StatCard` component from `features/activities/cards/activity-feed-expanded/components/SessionStats.tsx`.

## Stats to Display

| Stat | Source | Notes |
|------|--------|-------|
| **Duration** | `session.duration` | Already available on `FullGymSession` |
| **Total Volume** | `session_stats.total_volume` | Needs `session_stats(*)` added to the query |
| **Calories** | `session_stats.calories` | Needs `session_stats(*)` added to the query |
| **Exercises** | `gym_session_exercises.length` | Already available client-side |
| **Total Sets** | Sum of all `gym_sets` arrays | Compute client-side |
| **Muscle Groups Hit** | `COUNT(DISTINCT muscle_group)` | Compute client-side from exercise data |

## Design

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

## Implementation

### 1. Extract shared `StatCard` component
Move the `StatCard` from `features/activities/cards/activity-feed-expanded/components/SessionStats.tsx` into a shared location at `components/StatCard.tsx`. Update the activity `SessionStats.tsx` to import from the new shared location.

**`components/StatCard.tsx`:**
```tsx
type StatCardProps = {
  label: string;
  sublabel?: string;
  value: string;
};

export function StatCard({ label, sublabel, value }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[30%] flex flex-col items-center justify-between gap-1 border border-blue-500 py-3 px-2 rounded-lg bg-slate-950/50">
      <div className="flex items-center justify-center gap-1">
        <span className="text-gray-300 text-sm truncate">{label}</span>
        {sublabel && <span className="text-gray-500 text-xs">{sublabel}</span>}
      </div>
      <span className="text-gray-100 text-base text-center">{value}</span>
    </div>
  );
}
```

### 2. Update `get-full-gym-session.ts` query
Add `session_stats(*)` to the Supabase select so we get calories and total_volume:

```ts
.select(
  `*, session_stats(*), gym_session_exercises(
    *,
    gym_exercises(
      *,
      gym_exercises_translations!inner(name)
    ),
    gym_sets(*)
  )`,
)
```

The `FullGymSession` type is auto-inferred from the return type, so it will automatically include `session_stats`.

### 3. Update `gym-expanded.tsx`
- Remove the plain "Duration: X h Y min" text line.
- Import `StatCard` from `components/StatCard`.
- Compute client-side stats:
  - `exerciseCount` = `gym_session_exercises.length`
  - `totalSets` = sum of all `exercise.gym_sets.length`
  - `muscleGroupsHit` = count of distinct `muscle_group` values from exercises
- Read from `session_stats`:
  - `calories` (round to integer)
  - `total_volume` (format with locale-aware number + weight unit)
- Render two rows of 3 `StatCard` components between the time display and notes.

### 4. Add translations
Add new keys to both `en/gym.json` and `fi/gym.json`:

**English (`app/lib/i18n/locales/en/gym.json`):**
```json
"gym.session.totalVolume": "Volume",
"gym.session.calories": "Calories",
"gym.session.exercises": "Exercises",
"gym.session.totalSets": "Sets",
"gym.session.muscleGroups": "Muscles"
```

**Finnish (`app/lib/i18n/locales/fi/gym.json`):**
```json
"gym.session.totalVolume": "Volyymi",
"gym.session.calories": "Kalorit",
"gym.session.exercises": "Liikkeet",
"gym.session.totalSets": "Sarjat",
"gym.session.muscleGroups": "Lihasryhmät"
```

Note: "Duration" translation already exists at `gym.analytics.duration`.

### 5. Format volume with user's weight unit
Use the existing `weightUnit` from `useUserStore` (already read in `gym-expanded.tsx`) when displaying total volume, e.g. `"12,500 kg"`.

## Files to Change

| File | Change |
|------|--------|
| `web/components/StatCard.tsx` | **New** — extract shared StatCard component |
| `web/features/activities/cards/activity-feed-expanded/components/SessionStats.tsx` | Import `StatCard` from shared location, remove local definition |
| `web/database/gym/get-full-gym-session.ts` | Add `session_stats(*)` to select query |
| `web/features/gym/cards/gym-expanded.tsx` | Add stat card grid with 6 stats |
| `web/app/lib/i18n/locales/en/gym.json` | Add 5 new translation keys |
| `web/app/lib/i18n/locales/fi/gym.json` | Add 5 new translation keys |

## Edge Cases
- Sessions with only cardio exercises → total volume = 0, display "0 kg"
- Sessions with no sets → all numeric stats show "0"
- Old sessions without `session_stats` row → show "—" for calories/volume
- `session_stats` is an array from Supabase (one-to-many join) → use `session_stats?.[0]` to access the first (and only) row
