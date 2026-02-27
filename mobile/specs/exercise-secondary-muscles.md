# Exercise Secondary Muscles

## Overview
Add a `gym_exercise_muscles` junction table to store primary and secondary muscle groups per exercise. This replaces the single `muscle_group` column on `gym_exercises` as the source of truth, enabling richer analytics and session summaries.

## Current State
- Each exercise has a single `muscle_group` text column on `gym_exercises` (e.g., "chest")
- The add/edit exercise screens use a single `SelectInput` dropdown for muscle group
- Analytics (`last_30d_analytics`) counts exercises/sets per `gym_exercises.muscle_group`
- The gym expanded card counts distinct `muscle_group` values for the "Muscles" stat
- Exercise dropdowns display `muscle_group` as a subtitle

## Database Design

### New Table
```sql
CREATE TABLE public.gym_exercise_muscles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  muscle_group text NOT NULL,
  role text NOT NULL CHECK (role IN ('primary', 'secondary')),
  CONSTRAINT gym_exercise_muscles_pkey PRIMARY KEY (id),
  CONSTRAINT gym_exercise_muscles_unique UNIQUE (exercise_id, muscle_group)
);
```

### Example
For Bench Press (`exercise_id = abc-123`):
| muscle_group | role |
|---|---|
| chest | primary |
| triceps | secondary |
| front_delts | secondary |

### Migration Strategy
1. Create `gym_exercise_muscles` table with RLS
2. Backfill from existing `gym_exercises.muscle_group` — insert one row per exercise with `role = 'primary'`
3. **Keep** `muscle_group` on `gym_exercises` as a denormalized primary shortcut — it's used in many places (dropdowns, analytics, expanded card) and removing it would be a large refactor with no real benefit. The junction table is the source of truth for multi-muscle data; the column stays as a quick-access field for the primary muscle.

## Implementation

### Phase 1: Database

#### Migration 1: Create table + backfill
```sql
CREATE TABLE public.gym_exercise_muscles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  muscle_group text NOT NULL,
  role text NOT NULL CHECK (role IN ('primary', 'secondary')),
  CONSTRAINT gym_exercise_muscles_pkey PRIMARY KEY (id),
  CONSTRAINT gym_exercise_muscles_unique UNIQUE (exercise_id, muscle_group)
);

ALTER TABLE public.gym_exercise_muscles ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read (exercises are shared)
CREATE POLICY "anyone can read exercise muscles"
  ON public.gym_exercise_muscles FOR SELECT
  TO authenticated
  USING (true);

-- RLS: users can insert for their own exercises
CREATE POLICY "users can insert exercise muscles"
  ON public.gym_exercise_muscles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gym_exercises ge
      WHERE ge.id = exercise_id AND ge.user_id = auth.uid()
    )
  );

-- RLS: users can update their own exercise muscles
CREATE POLICY "users can update exercise muscles"
  ON public.gym_exercise_muscles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gym_exercises ge
      WHERE ge.id = exercise_id AND ge.user_id = auth.uid()
    )
  );

-- RLS: users can delete their own exercise muscles
CREATE POLICY "users can delete exercise muscles"
  ON public.gym_exercise_muscles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gym_exercises ge
      WHERE ge.id = exercise_id AND ge.user_id = auth.uid()
    )
  );

-- Backfill: insert primary muscle for all existing exercises
INSERT INTO gym_exercise_muscles (exercise_id, muscle_group, role)
SELECT id, muscle_group, 'primary'
FROM gym_exercises
WHERE muscle_group IS NOT NULL;
```

#### Seed Data: Common Secondary Muscles
A separate migration to pre-populate secondary muscles for **system exercises** (where `user_id IS NULL`). This is valuable because users shouldn't have to manually add well-known secondary muscles. Example mappings:

| Exercise Pattern | Primary | Secondary |
|---|---|---|
| Bench Press variants | chest | triceps, front_delts |
| Overhead Press | front_delts | triceps, side_delts |
| Rows | lats | biceps, rear_delts |
| Squats | quads | glutes, hamstrings |
| Deadlift variants | hamstrings | glutes, lower_back, traps |
| Pull-ups/Lat Pull | lats | biceps, forearms |
| Dips | chest/triceps | front_delts |
| Curls | biceps | forearms |
| Lunges | quads | glutes, hamstrings |

This seed data can be created as a separate migration by matching on exercise names. User-created exercises start with only their primary muscle — users can add secondary muscles through the edit screen.

### Phase 2: Frontend — Add/Edit Exercise Screens

#### New Component: `MultiSelectInput`
Create a new `components/MultiSelectInput.tsx` based on the existing `SelectInput` pattern:
- Same modal UI with the options list
- Multiple items can be selected (checkmarks on multiple rows)
- Selected items shown as comma-separated text in the trigger button
- Props: `values: string[]`, `onChange: (values: string[]) => void`, same `options` array

#### Update Add Exercise Screen (`app/gym/add-exercise/index.tsx`)
- Add a `MultiSelectInput` below the existing muscle group dropdown for secondary muscles
- Label: "Secondary Muscles" / "Toissijaiset lihakset"
- Filter out the selected primary muscle from the secondary options (can't be both)
- On save: call new DB function or insert into `gym_exercise_muscles` after creating the exercise

#### Update `addExercise()` database function
After inserting the exercise, also insert rows into `gym_exercise_muscles`:
- One row with `role = 'primary'` for the selected muscle group
- One row per selected secondary muscle with `role = 'secondary'`

Option A (simpler): Do this client-side with two Supabase calls (insert exercise, then insert muscles)
Option B (atomic): Create an RPC that handles both in a transaction

**Recommended: Option A** — the exercise insert returns the new ID, then batch insert the muscles. If the muscle insert fails, the exercise still exists but without secondary data, which is acceptable.

#### Update Edit Exercise Screen (`app/gym/edit-exercise/index.tsx`)
- Fetch existing secondary muscles when an exercise is selected
- Show them in the `MultiSelectInput`
- On save: delete existing `gym_exercise_muscles` for this exercise, re-insert all (primary + secondary)

#### Update `editExercise()` database function
- After updating `gym_exercises`, delete all `gym_exercise_muscles` for that exercise and re-insert fresh rows

### Phase 3: Display — Exercise Dropdowns

#### Update `ExerciseDropdown` (`features/gym/components/ExerciseDropdown.tsx`)
- Update `getExercises()` query to join `gym_exercise_muscles`:
  ```
  gym_exercise_muscles(muscle_group, role)
  ```
- Display secondary muscles as a subtle subtitle under the existing muscle group label
- Format: "Chest · Triceps, Front Delts" (primary in normal text, secondary in gray/smaller)

#### Update `ExerciseDropdownEdit` similarly

### Phase 4: Session Summary & Analytics

#### Update Gym Expanded Card (`features/gym/cards/gym-expanded.tsx`)
The "Muscles" stat card currently counts distinct `muscle_group` values from exercises. Update to:
- Fetch `gym_exercise_muscles` via the session query (join through exercises)
- Count distinct muscle groups across both primary AND secondary
- This gives a more accurate count: a session with Bench Press + Tricep Pushdown shows 3 muscles (chest, triceps, front_delts) instead of 2 (chest, triceps)

**Query update** in `get-full-gym-session.ts`:
```
gym_session_exercises(
  *,
  gym_exercises(
    *,
    gym_exercises_translations!inner(name),
    gym_exercise_muscles(muscle_group, role)
  ),
  gym_sets(*)
)
```

#### Update Analytics RPC (`last_30d_analytics`)
Optionally enhance the analytics to differentiate primary vs secondary muscle activation. Two approaches:
- **Simple:** Count both primary and secondary as equal hits (just join `gym_exercise_muscles` instead of `gym_exercises.muscle_group`)
- **Weighted:** Count primary as 1, secondary as 0.5 for more realistic volume distribution

**Recommended: Simple** for now — just replace `ge.muscle_group` joins with `gym_exercise_muscles` joins.

### Phase 5: Exercise Detail Display

#### Update Exercise Card in gym form (`features/gym/components/ExerciseCard.tsx`)
- Show secondary muscles as small text below the exercise name
- Format: "Chest · Triceps, Front Delts"

#### Update Gym Expanded Card exercise rows
- Show secondary muscles under each exercise name in the expanded session view
- Same format as above

## Files to Change

| File | Change |
|---|---|
| **Database** | |
| `supabase/migrations/YYYYMMDD_create_gym_exercise_muscles.sql` | Create table, RLS, backfill |
| `supabase/migrations/YYYYMMDD_seed_secondary_muscles.sql` | Pre-populate system exercises |
| `mobile/types/database.types.ts` | Add `gym_exercise_muscles` type (regenerate) |
| **New Component** | |
| `mobile/components/MultiSelectInput.tsx` | New multi-select dropdown |
| **Add/Edit Screens** | |
| `mobile/app/gym/add-exercise/index.tsx` | Add secondary muscles picker |
| `mobile/app/gym/edit-exercise/index.tsx` | Add secondary muscles picker + fetch existing |
| `mobile/database/gym/add-exercise.ts` | Insert into `gym_exercise_muscles` after exercise |
| `mobile/database/gym/edit-exercise.ts` | Delete + re-insert `gym_exercise_muscles` |
| **Queries** | |
| `mobile/database/gym/get-exercises.ts` | Join `gym_exercise_muscles` |
| `mobile/database/gym/get-full-gym-session.ts` | Join `gym_exercise_muscles` through exercises |
| `mobile/database/gym/user-exercises.ts` | Join `gym_exercise_muscles` |
| **Display** | |
| `mobile/features/gym/components/ExerciseDropdown.tsx` | Show secondary muscles |
| `mobile/features/gym/components/ExerciseDropDownEdit.tsx` | Show secondary muscles |
| `mobile/features/gym/cards/gym-expanded.tsx` | Count all muscles (primary + secondary) |
| `mobile/features/gym/components/ExerciseCard.tsx` | Show secondary muscles |
| **Analytics** | |
| `supabase/migrations/YYYYMMDD_update_analytics_secondary_muscles.sql` | Update `last_30d_analytics` to use junction table |
| **Translations** | |
| `mobile/locales/en/gym.json` | secondaryMuscles, noSecondaryMuscles |
| `mobile/locales/fi/gym.json` | Same in Finnish |

## Translations

### English
```json
"addExerciseScreen": {
  "secondaryMuscles": "Secondary Muscles",
  "noSecondaryMuscles": "None selected"
}
```

### Finnish
```json
"addExerciseScreen": {
  "secondaryMuscles": "Toissijaiset lihakset",
  "noSecondaryMuscles": "Ei valittu"
}
```

## Implementation Order
1. Migration: create table + backfill primary muscles
2. Update `database.types.ts`
3. Create `MultiSelectInput` component
4. Update add exercise screen + DB function
5. Update edit exercise screen + DB function
6. Update exercise queries to join muscles
7. Update exercise dropdowns to display secondary muscles
8. Update gym expanded card muscle count
9. Seed secondary muscles for system exercises
10. Update analytics RPC (optional, can be a follow-up)

## Edge Cases
- Exercises with no muscles in junction table (shouldn't happen after backfill, but fall back to `gym_exercises.muscle_group`)
- User selects same muscle as both primary and secondary — prevented by filtering primary out of secondary options
- System exercises: users can't edit these, so secondary muscles come only from the seed data
- Deleting an exercise cascades to `gym_exercise_muscles` automatically (ON DELETE CASCADE)
