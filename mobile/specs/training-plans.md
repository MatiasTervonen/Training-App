# Training Plans

## Overview

Training plans let users create structured, multi-week gym programs with prescribed targets (weight, reps, RPE) for every exercise on every session of every week. The app tracks which session is next and pre-fills the workout form with that day's targets. After completing all weeks, the plan can be restarted or archived.

This is the foundation for a future coach feature where a coach can create and assign plans to athletes.

## Key Decisions

### Why not just cycle templates?
| Option | Verdict |
|--------|---------|
| Infinite template cycling (A → B → C → A…) | No progression — same weight/reps every time. Just a template rotator. |
| Multi-week plan with prescribed targets per session | **Chosen** — supports linear progression, undulating periodization, deloads, any programming style |

### Where do targets live?
| Option | Verdict |
|--------|---------|
| JSONB blob on plan day | Hard to query, no FK integrity, can't index |
| Separate `training_plan_targets` table | **Chosen** — normalized, queryable, FK cascade on exercise delete, coach-editable per row |

### Plan length
| Option | Verdict |
|--------|---------|
| Always infinite cycle | Can't represent a 4-week block with a deload |
| Finite weeks (nullable for infinite) | **Chosen** — `total_weeks = 4` for a 4-week block, `NULL` for infinite cycling without targets |

### What happens when a plan is active and user does a freestyle session?
Plan position does NOT advance. Only sessions started from the plan advance the position. Users can always do freestyle workouts without affecting their plan progress.

### What happens when a template in the plan is deleted?
FK cascade removes the `training_plan_days` row. Plan adjusts — if the deleted day was next, skip to the following day. If the plan has no days left, deactivate it.

---

## Database

### Migration: `supabase/migrations/YYYYMMDDHHMMSS_training_plans.sql`

### Table: `training_plans`

The overall program container.

```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  is_active BOOLEAN NOT NULL DEFAULT false,
  total_weeks INTEGER, -- NULL = infinite cycle (no targets), set = finite program
  current_week INTEGER NOT NULL DEFAULT 1,
  current_position INTEGER NOT NULL DEFAULT 0, -- 0-based day index within the week
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_plans_user_active ON training_plans (user_id, is_active);
```

**Constraint:** Only one active plan per user. Enforced via RPC — when activating a plan, deactivate all others first.

### Table: `training_plan_days`

Ordered workout slots within a plan. Each day references a template.

```sql
CREATE TABLE training_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES gym_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- 0-based order (Day 1 = 0, Day 2 = 1, etc.)
  label TEXT CHECK (char_length(label) <= 100), -- optional: "Push Day", "Heavy Squat"
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_id, position)
);

CREATE INDEX idx_training_plan_days_plan ON training_plan_days (plan_id, position);
```

### Table: `training_plan_targets`

Prescribed sets for a specific week + day + exercise. This is where progression lives.

```sql
CREATE TABLE training_plan_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES training_plan_days(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- 1-based (week 1, 2, 3...)
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  exercise_position INTEGER NOT NULL DEFAULT 0, -- order within the day
  set_number INTEGER NOT NULL, -- 1-based (set 1, 2, 3...)
  target_weight NUMERIC(7,2),
  target_reps INTEGER,
  target_rpe TEXT CHECK (char_length(target_rpe) <= 20),
  notes TEXT CHECK (char_length(notes) <= 500), -- "slow eccentric", "pause rep"
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_day_id, week_number, exercise_id, set_number)
);

CREATE INDEX idx_training_plan_targets_lookup
  ON training_plan_targets (plan_day_id, week_number);
```

### RLS Policies

All three tables follow the same pattern:

```sql
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_targets ENABLE ROW LEVEL SECURITY;

-- training_plans
CREATE POLICY "training_plans_select" ON training_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plans_insert" ON training_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plans_update" ON training_plans
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plans_delete" ON training_plans
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- training_plan_days
CREATE POLICY "training_plan_days_select" ON training_plan_days
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_days_insert" ON training_plan_days
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plan_days_update" ON training_plan_days
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_days_delete" ON training_plan_days
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- training_plan_targets
CREATE POLICY "training_plan_targets_select" ON training_plan_targets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_targets_insert" ON training_plan_targets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plan_targets_update" ON training_plan_targets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_targets_delete" ON training_plan_targets
  FOR DELETE TO authenticated USING (user_id = auth.uid());
```

---

## RPC Functions

### `training_plan_save`

Creates a new training plan with days and optional targets in one call.

```sql
DROP FUNCTION IF EXISTS training_plan_save;
CREATE FUNCTION training_plan_save(
  p_name TEXT,
  p_total_weeks INTEGER DEFAULT NULL,
  p_days JSONB DEFAULT '[]'::JSONB,
  -- p_days: [{ template_id, position, label }]
  p_targets JSONB DEFAULT '[]'::JSONB
  -- p_targets: [{ day_position, week_number, exercise_id, exercise_position, set_number, target_weight, target_reps, target_rpe, notes }]
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan_id UUID;
  v_day JSONB;
  v_day_id UUID;
  v_target JSONB;
  v_day_ids JSONB := '{}'::JSONB; -- map position -> day_id
BEGIN
  -- Insert plan
  INSERT INTO training_plans (name, total_weeks)
  VALUES (p_name, p_total_weeks)
  RETURNING id INTO v_plan_id;

  -- Insert days
  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days) LOOP
    INSERT INTO training_plan_days (plan_id, template_id, position, label)
    VALUES (
      v_plan_id,
      (v_day->>'template_id')::UUID,
      (v_day->>'position')::INTEGER,
      v_day->>'label'
    )
    RETURNING id INTO v_day_id;

    v_day_ids := v_day_ids || jsonb_build_object((v_day->>'position')::TEXT, v_day_id::TEXT);
  END LOOP;

  -- Insert targets
  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    INSERT INTO training_plan_targets (
      plan_day_id, week_number, exercise_id, exercise_position,
      set_number, target_weight, target_reps, target_rpe, notes
    )
    VALUES (
      (v_day_ids->>((v_target->>'day_position')::TEXT))::UUID,
      (v_target->>'week_number')::INTEGER,
      (v_target->>'exercise_id')::UUID,
      COALESCE((v_target->>'exercise_position')::INTEGER, 0),
      (v_target->>'set_number')::INTEGER,
      (v_target->>'target_weight')::NUMERIC,
      (v_target->>'target_reps')::INTEGER,
      v_target->>'target_rpe',
      v_target->>'notes'
    );
  END LOOP;

  RETURN v_plan_id;
END;
$$;
```

### `training_plan_activate`

Activates a plan and deactivates all others.

```sql
DROP FUNCTION IF EXISTS training_plan_activate;
CREATE FUNCTION training_plan_activate(
  p_plan_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
BEGIN
  -- Deactivate all plans for this user
  UPDATE training_plans SET is_active = false
  WHERE user_id = auth.uid() AND is_active = true;

  -- Activate the selected plan and reset progress
  UPDATE training_plans
  SET is_active = true, current_week = 1, current_position = 0, updated_at = now()
  WHERE id = p_plan_id AND user_id = auth.uid();
END;
$$;
```

### `training_plan_advance`

Called after saving a gym session that was started from the plan. Advances position and wraps to next week.

```sql
DROP FUNCTION IF EXISTS training_plan_advance;
CREATE FUNCTION training_plan_advance(
  p_plan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan training_plans%ROWTYPE;
  v_day_count INTEGER;
  v_new_position INTEGER;
  v_new_week INTEGER;
  v_completed BOOLEAN := false;
BEGIN
  SELECT * INTO v_plan FROM training_plans
  WHERE id = p_plan_id AND user_id = auth.uid();

  SELECT COUNT(*) INTO v_day_count
  FROM training_plan_days WHERE plan_id = p_plan_id;

  v_new_position := v_plan.current_position + 1;
  v_new_week := v_plan.current_week;

  -- Wrap to next week
  IF v_new_position >= v_day_count THEN
    v_new_position := 0;
    v_new_week := v_new_week + 1;

    -- Check if program is complete (finite plans)
    IF v_plan.total_weeks IS NOT NULL AND v_new_week > v_plan.total_weeks THEN
      v_completed := true;
      UPDATE training_plans
      SET is_active = false, updated_at = now()
      WHERE id = p_plan_id;

      RETURN jsonb_build_object('completed', true);
    END IF;
  END IF;

  UPDATE training_plans
  SET current_position = v_new_position,
      current_week = v_new_week,
      updated_at = now()
  WHERE id = p_plan_id;

  RETURN jsonb_build_object(
    'completed', false,
    'current_week', v_new_week,
    'current_position', v_new_position
  );
END;
$$;
```

### `training_plan_get_current`

Returns the active plan with the current day's template and targets.

```sql
DROP FUNCTION IF EXISTS training_plan_get_current;
CREATE FUNCTION training_plan_get_current()
RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan RECORD;
  v_day RECORD;
  v_targets JSONB;
  v_day_count INTEGER;
BEGIN
  -- Get active plan
  SELECT id, name, total_weeks, current_week, current_position
  INTO v_plan
  FROM training_plans
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get day count
  SELECT COUNT(*) INTO v_day_count
  FROM training_plan_days WHERE plan_id = v_plan.id;

  -- Get current day
  SELECT d.id, d.template_id, d.label, d.position,
         t.name AS template_name
  INTO v_day
  FROM training_plan_days d
  JOIN gym_templates t ON t.id = d.template_id
  WHERE d.plan_id = v_plan.id AND d.position = v_plan.current_position;

  IF v_day IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get targets for current week + day (if any)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'exercise_id', tgt.exercise_id,
      'exercise_position', tgt.exercise_position,
      'set_number', tgt.set_number,
      'target_weight', tgt.target_weight,
      'target_reps', tgt.target_reps,
      'target_rpe', tgt.target_rpe,
      'notes', tgt.notes
    ) ORDER BY tgt.exercise_position, tgt.set_number
  ), '[]'::JSONB)
  INTO v_targets
  FROM training_plan_targets tgt
  WHERE tgt.plan_day_id = v_day.id AND tgt.week_number = v_plan.current_week;

  RETURN jsonb_build_object(
    'plan_id', v_plan.id,
    'plan_name', v_plan.name,
    'total_weeks', v_plan.total_weeks,
    'current_week', v_plan.current_week,
    'current_position', v_plan.current_position,
    'day_count', v_day_count,
    'day_label', v_day.label,
    'template_id', v_day.template_id,
    'template_name', v_day.template_name,
    'targets', v_targets
  );
END;
$$;
```

### `training_plan_get_full`

Returns the complete plan with all days and all targets for the plan detail/edit page.

```sql
DROP FUNCTION IF EXISTS training_plan_get_full;
CREATE FUNCTION training_plan_get_full(
  p_plan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan RECORD;
  v_days JSONB;
BEGIN
  SELECT id, name, total_weeks, current_week, current_position, is_active, created_at
  INTO v_plan
  FROM training_plans
  WHERE id = p_plan_id AND user_id = auth.uid();

  IF v_plan IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'template_id', d.template_id,
      'template_name', t.name,
      'position', d.position,
      'label', d.label,
      'targets', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'week_number', tgt.week_number,
            'exercise_id', tgt.exercise_id,
            'exercise_position', tgt.exercise_position,
            'set_number', tgt.set_number,
            'target_weight', tgt.target_weight,
            'target_reps', tgt.target_reps,
            'target_rpe', tgt.target_rpe,
            'notes', tgt.notes
          ) ORDER BY tgt.week_number, tgt.exercise_position, tgt.set_number
        ), '[]'::JSONB)
        FROM training_plan_targets tgt
        WHERE tgt.plan_day_id = d.id
      )
    ) ORDER BY d.position
  ), '[]'::JSONB)
  INTO v_days
  FROM training_plan_days d
  JOIN gym_templates t ON t.id = d.template_id
  WHERE d.plan_id = v_plan.id;

  RETURN jsonb_build_object(
    'id', v_plan.id,
    'name', v_plan.name,
    'total_weeks', v_plan.total_weeks,
    'current_week', v_plan.current_week,
    'current_position', v_plan.current_position,
    'is_active', v_plan.is_active,
    'created_at', v_plan.created_at,
    'days', v_days
  );
END;
$$;
```

---

## Data Flow

### Starting a Session from Plan

1. User opens gym hub → app calls `training_plan_get_current()`
2. If active plan exists → show banner: **"Week 2 · Push Day — Bench, OHP, Flies"**
3. User taps banner → load full template via existing `getFullTemplate(template_id)`
4. If targets exist for this week+day → **merge targets into exercise sets**:
   - Map targets by `exercise_id` → for each exercise, pre-fill sets with `target_weight`, `target_reps`, `target_rpe`
   - Target `notes` shown as hint text on each exercise card
5. Save to AsyncStorage draft as normal → navigate to `/gym/gym`
6. GymForm loads with pre-filled target values — user adjusts as needed during workout
7. After save → call `training_plan_advance(plan_id)` → position moves to next day
8. If `advance` returns `completed: true` → show "Plan Complete!" screen

### Merging Targets into GymForm

When targets exist, the exercise sets in GymForm are pre-filled:

```typescript
// Without plan targets (current behavior):
sets: [] // user adds sets manually

// With plan targets:
sets: [
  { weight: 82.5, reps: 8, rpe: "7" },  // from target
  { weight: 82.5, reps: 8, rpe: "7" },  // from target
  { weight: 82.5, reps: 8, rpe: "7" },  // from target
  { weight: 80,   reps: 8, rpe: "8" },  // from target
]
// User sees these pre-filled and adjusts as needed
```

The user can always override targets — they're suggestions, not constraints. Actual logged sets go into `gym_sets` as normal.

### Actual vs Target Comparison

After saving a session that came from a plan, the completion page can show how the user performed against targets:

| Exercise | Target | Actual |
|----------|--------|--------|
| Bench Press Set 1 | 82.5kg × 8 | 82.5kg × 8 ✓ |
| Bench Press Set 2 | 82.5kg × 8 | 82.5kg × 7 ↓ |
| Bench Press Set 3 | 82.5kg × 8 | 80kg × 8 ↓ |

This comparison is computed client-side by matching `gym_sets` from the saved session against the targets from `training_plan_get_current()`.

---

## Creating a Plan — UX Flow

### Step 1: Plan Setup
- **Route:** `/gym/plans/create`
- Name input (e.g. "Hypertrophy Block")
- Total weeks input (number picker, or toggle "No end date" for infinite cycling)

### Step 2: Add Days
- Select from existing templates
- Drag to reorder
- Optional label per day (defaults to template name)
- Must have at least 1 day

### Step 3: Add Targets (optional)
- Week selector tabs at top: **W1** | **W2** | **W3** | **W4**
- For each day, show the template's exercises
- For each exercise, show set rows with inputs: **weight**, **reps**, **RPE**
- UX helpers to reduce input burden:
  - **"Copy from template"** — week 1 auto-fills from template's `gym_template_sets`
  - **"Duplicate week"** — copy W1 targets → W2, then just bump weights
  - **"+2.5kg per week"** — per-exercise button that auto-fills remaining weeks with linear increment
  - **Leave blank** — if no targets for a week, that session falls back to template defaults

### Step 4: Save
- Calls `training_plan_save` RPC with all data
- Optionally activate immediately

---

## Gym Hub Integration

### Active Plan Banner

On `/gym/index.tsx`, when an active plan exists, show a prominent banner above the existing buttons:

```
┌──────────────────────────────────────┐
│  📋 Hypertrophy Block                │
│  Week 2 of 4 · Next: Push Day       │
│                                      │
│  [ Start Plan Session ]              │
└──────────────────────────────────────┘
```

Tapping "Start Plan Session" loads the template with targets pre-filled and starts the session.

### Plans List

Add a **"Training Plans"** button on the gym hub (alongside Templates, My Sessions, etc.) that goes to `/gym/plans` — a list of all plans (active highlighted, past plans shown below).

---

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `app/gym/plans/index.tsx` | List all training plans |
| `app/gym/plans/create/index.tsx` | Create new plan (steps 1-3) |
| `app/gym/plans/[id]/index.tsx` | Plan detail — view days, week progress, targets |
| `app/gym/plans/[id]/edit/index.tsx` | Edit plan — modify days, targets |

---

## File Structure

```
app/gym/
  plans/
    index.tsx                           # Plans list page
    create/index.tsx                    # Create plan (multi-step)
    [id]/
      index.tsx                         # Plan detail view
      edit/index.tsx                    # Edit plan

features/gym/
  plans/
    components/
      PlanBanner.tsx                    # Active plan banner for gym hub
      PlanDayCard.tsx                   # Day card showing template + label
      WeekTargetsEditor.tsx             # Week tab view with target inputs per exercise
      TargetSetRow.tsx                  # Single set target input (weight/reps/RPE)
      WeekSelector.tsx                  # W1 | W2 | W3 | W4 tab bar
      PlanProgressBar.tsx              # Visual progress through the plan
      ActualVsTargetCard.tsx           # Post-session comparison card
    hooks/
      useSavePlan.ts                    # Save plan RPC call + React Query mutation
      useActivePlan.ts                  # Fetch active plan via training_plan_get_current
      useFullPlan.ts                    # Fetch full plan via training_plan_get_full
      useAdvancePlan.ts                 # Advance position after session save
      usePlanTargetMerge.ts            # Merge targets into ExerciseEntry[] for GymForm

database/gym/
  plans/
    save-plan.ts                        # → training_plan_save RPC
    get-current-plan.ts                 # → training_plan_get_current RPC
    get-full-plan.ts                    # → training_plan_get_full RPC
    activate-plan.ts                    # → training_plan_activate RPC
    advance-plan.ts                     # → training_plan_advance RPC
    get-plans.ts                        # → SELECT from training_plans (list)
    delete-plan.ts                      # → DELETE from training_plans
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/gym/index.tsx` | Add plan banner (PlanBanner) and "Training Plans" nav button |
| `features/gym/hooks/useSaveSession.ts` | After save, if session came from plan → call `training_plan_advance` |
| `features/gym/components/GymForm.tsx` | Accept optional plan targets, show target hints on set inputs |
| `app/gym/gym/index.tsx` | Pass plan context (plan_id, targets) to GymForm when starting from plan |
| `app/gym/training-finished/index.tsx` | Show actual vs target comparison when session was from a plan |
| `database/gym/save-session.ts` | Pass plan_id so `sessions.template_id` is set (already exists on table) |
| `locales/en/gym.json` | Add `plans.*` translation keys |
| `locales/fi/gym.json` | Add `plans.*` translation keys |

---

## Translations

Add to `locales/en/gym.json` and `locales/fi/gym.json`:

```json
{
  "plans": {
    "title": "Training Plans",
    "create": "Create Plan",
    "edit": "Edit Plan",
    "planName": "Plan Name",
    "totalWeeks": "Total Weeks",
    "noEndDate": "No end date",
    "addDays": "Add Days",
    "selectTemplate": "Select Template",
    "dayLabel": "Day Label",
    "targets": "Targets",
    "week": "Week",
    "copyFromTemplate": "Copy from template",
    "duplicateWeek": "Duplicate week",
    "incrementPerWeek": "+{{amount}}kg/week",
    "activate": "Activate Plan",
    "deactivate": "Deactivate",
    "activePlan": "Active Plan",
    "weekOf": "Week {{current}} of {{total}}",
    "nextSession": "Next: {{name}}",
    "startPlanSession": "Start Plan Session",
    "planComplete": "Plan Complete!",
    "completedMessage": "You finished all {{weeks}} weeks of {{name}}.",
    "restart": "Restart Plan",
    "targetWeight": "Target",
    "actualWeight": "Actual",
    "onTarget": "On target",
    "belowTarget": "Below target",
    "aboveTarget": "Above target",
    "noTargets": "No targets set for this week",
    "deletePlan": "Delete Plan",
    "deletePlanConfirm": "Are you sure you want to delete this plan?",
    "noPlan": "No active plan",
    "noPlanDesc": "Create a training plan to get structured programming with weekly progression."
  }
}
```

Finnish translations with proper ä/ö characters.

---

## Implementation Order

1. **Migration** — Create tables + RLS + all RPC functions → `supabase db push`
2. **Database layer** — `database/gym/plans/` files wrapping each RPC
3. **Hooks** — `useActivePlan`, `useFullPlan`, `useSavePlan`, `useAdvancePlan`
4. **Plans list page** — `/gym/plans` with create button and plan cards
5. **Create plan page** — Multi-step: name/weeks → add days → add targets
6. **Plan detail page** — View days, week progress, targets per week
7. **Gym hub integration** — PlanBanner showing next session
8. **Target merge** — `usePlanTargetMerge` to pre-fill GymForm sets from targets
9. **Session save integration** — Advance plan after session save, store plan context
10. **Completion page** — Actual vs target comparison card
11. **Edit plan** — Modify days, targets, settings on existing plan
12. **Translations** — EN + FI

---

## Reference Patterns

- `features/gym/components/TemplateForm.tsx` — Multi-exercise form with drag-to-reorder, similar UX to target editor
- `features/gym/hooks/template/useSaveTemplate.ts` — RPC call pattern with React Query mutation
- `database/gym/get-full-template.ts` — Loading nested data (template + exercises), same pattern for plan + days + targets
- `features/gym/components/GymForm.tsx` — Where targets get merged into exercise sets
- `app/gym/templates/index.tsx` — List page with template cards, same pattern for plans list
