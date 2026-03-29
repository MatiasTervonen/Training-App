-- Decouple plan exercises from templates: add training_plan_day_exercises table,
-- remove template_id from training_plan_days, migrate targets to reference exercises.

-- ============================================================
-- Step 1: Drop old targets (will recreate with new FK)
-- ============================================================
DROP TABLE IF EXISTS training_plan_targets CASCADE;

-- ============================================================
-- Step 2: Remove template_id from training_plan_days
-- ============================================================
ALTER TABLE training_plan_days DROP COLUMN template_id;

-- ============================================================
-- Step 3: Create training_plan_day_exercises table
-- ============================================================
CREATE TABLE training_plan_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES training_plan_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  superset_id UUID,
  rest_timer_seconds INTEGER,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_day_id, exercise_id, position)
);

CREATE INDEX idx_training_plan_day_exercises_day
  ON training_plan_day_exercises (plan_day_id, position);

-- RLS
ALTER TABLE training_plan_day_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plan_day_exercises_select" ON training_plan_day_exercises
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_day_exercises_insert" ON training_plan_day_exercises
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plan_day_exercises_update" ON training_plan_day_exercises
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_day_exercises_delete" ON training_plan_day_exercises
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- Step 4: Recreate training_plan_targets with new FK
-- ============================================================
CREATE TABLE training_plan_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_exercise_id UUID NOT NULL REFERENCES training_plan_day_exercises(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  target_weight NUMERIC(7,2),
  target_reps INTEGER,
  target_rpe TEXT CHECK (char_length(target_rpe) <= 20),
  notes TEXT CHECK (char_length(notes) <= 500),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_day_exercise_id, week_number, set_number)
);

CREATE INDEX idx_training_plan_targets_lookup
  ON training_plan_targets (plan_day_exercise_id, week_number);

-- RLS
ALTER TABLE training_plan_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plan_targets_select" ON training_plan_targets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_targets_insert" ON training_plan_targets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plan_targets_update" ON training_plan_targets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_targets_delete" ON training_plan_targets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- Step 5: Replace all RPC functions
-- ============================================================

DROP FUNCTION IF EXISTS training_plan_save;
CREATE FUNCTION training_plan_save(
  p_name TEXT,
  p_total_weeks INTEGER DEFAULT NULL,
  p_days JSONB DEFAULT '[]'::JSONB,
  p_targets JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan_id UUID;
  v_day JSONB;
  v_day_id UUID;
  v_exercise JSONB;
  v_exercise_id UUID;
  v_target JSONB;
  v_day_ids JSONB := '{}'::JSONB;
  v_exercise_ids JSONB := '{}'::JSONB;
BEGIN
  INSERT INTO training_plans (name, total_weeks)
  VALUES (p_name, p_total_weeks)
  RETURNING id INTO v_plan_id;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days) LOOP
    INSERT INTO training_plan_days (plan_id, position, label)
    VALUES (
      v_plan_id,
      (v_day->>'position')::INTEGER,
      v_day->>'label'
    )
    RETURNING id INTO v_day_id;

    v_day_ids := v_day_ids || jsonb_build_object((v_day->>'position')::TEXT, v_day_id::TEXT);

    IF v_day->'exercises' IS NOT NULL THEN
      FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_day->'exercises') LOOP
        INSERT INTO training_plan_day_exercises (
          plan_day_id, exercise_id, position, superset_id, rest_timer_seconds
        )
        VALUES (
          v_day_id,
          (v_exercise->>'exercise_id')::UUID,
          (v_exercise->>'position')::INTEGER,
          (v_exercise->>'superset_id')::UUID,
          (v_exercise->>'rest_timer_seconds')::INTEGER
        )
        RETURNING id INTO v_exercise_id;

        v_exercise_ids := v_exercise_ids || jsonb_build_object(
          (v_day->>'position')::TEXT || ':' || (v_exercise->>'position')::TEXT,
          v_exercise_id::TEXT
        );
      END LOOP;
    END IF;
  END LOOP;

  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    INSERT INTO training_plan_targets (
      plan_day_exercise_id, week_number, set_number,
      target_weight, target_reps, target_rpe, notes
    )
    VALUES (
      (v_exercise_ids->>((v_target->>'day_position')::TEXT || ':' || (v_target->>'exercise_position')::TEXT))::UUID,
      (v_target->>'week_number')::INTEGER,
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

DROP FUNCTION IF EXISTS training_plan_update;
CREATE FUNCTION training_plan_update(
  p_plan_id UUID,
  p_name TEXT,
  p_total_weeks INTEGER DEFAULT NULL,
  p_days JSONB DEFAULT '[]'::JSONB,
  p_targets JSONB DEFAULT '[]'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_day JSONB;
  v_day_id UUID;
  v_exercise JSONB;
  v_exercise_id UUID;
  v_target JSONB;
  v_day_ids JSONB := '{}'::JSONB;
  v_exercise_ids JSONB := '{}'::JSONB;
BEGIN
  UPDATE training_plans
  SET name = p_name, total_weeks = p_total_weeks, updated_at = now()
  WHERE id = p_plan_id AND user_id = auth.uid();

  DELETE FROM training_plan_days WHERE plan_id = p_plan_id;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days) LOOP
    INSERT INTO training_plan_days (plan_id, position, label)
    VALUES (
      p_plan_id,
      (v_day->>'position')::INTEGER,
      v_day->>'label'
    )
    RETURNING id INTO v_day_id;

    v_day_ids := v_day_ids || jsonb_build_object((v_day->>'position')::TEXT, v_day_id::TEXT);

    IF v_day->'exercises' IS NOT NULL THEN
      FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_day->'exercises') LOOP
        INSERT INTO training_plan_day_exercises (
          plan_day_id, exercise_id, position, superset_id, rest_timer_seconds
        )
        VALUES (
          v_day_id,
          (v_exercise->>'exercise_id')::UUID,
          (v_exercise->>'position')::INTEGER,
          (v_exercise->>'superset_id')::UUID,
          (v_exercise->>'rest_timer_seconds')::INTEGER
        )
        RETURNING id INTO v_exercise_id;

        v_exercise_ids := v_exercise_ids || jsonb_build_object(
          (v_day->>'position')::TEXT || ':' || (v_exercise->>'position')::TEXT,
          v_exercise_id::TEXT
        );
      END LOOP;
    END IF;
  END LOOP;

  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    INSERT INTO training_plan_targets (
      plan_day_exercise_id, week_number, set_number,
      target_weight, target_reps, target_rpe, notes
    )
    VALUES (
      (v_exercise_ids->>((v_target->>'day_position')::TEXT || ':' || (v_target->>'exercise_position')::TEXT))::UUID,
      (v_target->>'week_number')::INTEGER,
      (v_target->>'set_number')::INTEGER,
      (v_target->>'target_weight')::NUMERIC,
      (v_target->>'target_reps')::INTEGER,
      v_target->>'target_rpe',
      v_target->>'notes'
    );
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS training_plan_activate;
CREATE FUNCTION training_plan_activate(
  p_plan_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
BEGIN
  UPDATE training_plans SET is_active = false
  WHERE user_id = auth.uid() AND is_active = true;

  UPDATE training_plans
  SET is_active = true, current_week = 1, current_position = 0, updated_at = now()
  WHERE id = p_plan_id AND user_id = auth.uid();
END;
$$;

DROP FUNCTION IF EXISTS training_plan_deactivate;
CREATE FUNCTION training_plan_deactivate(
  p_plan_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
BEGIN
  UPDATE training_plans
  SET is_active = false, updated_at = now()
  WHERE id = p_plan_id AND user_id = auth.uid();
END;
$$;

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
BEGIN
  SELECT * INTO v_plan FROM training_plans
  WHERE id = p_plan_id AND user_id = auth.uid();

  SELECT COUNT(*) INTO v_day_count
  FROM training_plan_days WHERE plan_id = p_plan_id;

  v_new_position := v_plan.current_position + 1;
  v_new_week := v_plan.current_week;

  IF v_new_position >= v_day_count THEN
    v_new_position := 0;
    v_new_week := v_new_week + 1;

    IF v_plan.total_weeks IS NOT NULL AND v_new_week > v_plan.total_weeks THEN
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

DROP FUNCTION IF EXISTS training_plan_get_current;
CREATE FUNCTION training_plan_get_current()
RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_plan RECORD;
  v_day RECORD;
  v_exercises JSONB;
  v_targets JSONB;
  v_day_count INTEGER;
BEGIN
  SELECT id, name, total_weeks, current_week, current_position
  INTO v_plan
  FROM training_plans
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_day_count
  FROM training_plan_days WHERE plan_id = v_plan.id;

  SELECT d.id, d.label, d.position
  INTO v_day
  FROM training_plan_days d
  WHERE d.plan_id = v_plan.id AND d.position = v_plan.current_position;

  IF v_day IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', de.id,
      'exercise_id', de.exercise_id,
      'position', de.position,
      'superset_id', de.superset_id,
      'rest_timer_seconds', de.rest_timer_seconds,
      'name', COALESCE(
        (SELECT et.name FROM gym_exercises_translations et
         WHERE et.exercise_id = de.exercise_id
         LIMIT 1),
        e.name
      ),
      'equipment', e.equipment,
      'muscle_group', e.muscle_group,
      'main_group', e.main_group
    ) ORDER BY de.position
  ), '[]'::JSONB)
  INTO v_exercises
  FROM training_plan_day_exercises de
  JOIN gym_exercises e ON e.id = de.exercise_id
  WHERE de.plan_day_id = v_day.id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'plan_day_exercise_id', tgt.plan_day_exercise_id,
      'exercise_id', de.exercise_id,
      'exercise_position', de.position,
      'set_number', tgt.set_number,
      'target_weight', tgt.target_weight,
      'target_reps', tgt.target_reps,
      'target_rpe', tgt.target_rpe,
      'notes', tgt.notes
    ) ORDER BY de.position, tgt.set_number
  ), '[]'::JSONB)
  INTO v_targets
  FROM training_plan_targets tgt
  JOIN training_plan_day_exercises de ON de.id = tgt.plan_day_exercise_id
  WHERE de.plan_day_id = v_day.id AND tgt.week_number = v_plan.current_week;

  RETURN jsonb_build_object(
    'plan_id', v_plan.id,
    'plan_name', v_plan.name,
    'total_weeks', v_plan.total_weeks,
    'current_week', v_plan.current_week,
    'current_position', v_plan.current_position,
    'day_count', v_day_count,
    'day_label', v_day.label,
    'exercises', v_exercises,
    'targets', v_targets
  );
END;
$$;

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
      'position', d.position,
      'label', d.label,
      'exercises', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', de.id,
            'exercise_id', de.exercise_id,
            'position', de.position,
            'superset_id', de.superset_id,
            'rest_timer_seconds', de.rest_timer_seconds,
            'name', COALESCE(
              (SELECT et.name FROM gym_exercises_translations et
               WHERE et.exercise_id = de.exercise_id
               LIMIT 1),
              e.name
            ),
            'equipment', e.equipment,
            'muscle_group', e.muscle_group,
            'main_group', e.main_group
          ) ORDER BY de.position
        ), '[]'::JSONB)
        FROM training_plan_day_exercises de
        JOIN gym_exercises e ON e.id = de.exercise_id
        WHERE de.plan_day_id = d.id
      ),
      'targets', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'plan_day_exercise_id', tgt.plan_day_exercise_id,
            'exercise_id', de.exercise_id,
            'exercise_position', de.position,
            'week_number', tgt.week_number,
            'set_number', tgt.set_number,
            'target_weight', tgt.target_weight,
            'target_reps', tgt.target_reps,
            'target_rpe', tgt.target_rpe,
            'notes', tgt.notes
          ) ORDER BY tgt.week_number, de.position, tgt.set_number
        ), '[]'::JSONB)
        FROM training_plan_targets tgt
        JOIN training_plan_day_exercises de ON de.id = tgt.plan_day_exercise_id
        WHERE de.plan_day_id = d.id
      )
    ) ORDER BY d.position
  ), '[]'::JSONB)
  INTO v_days
  FROM training_plan_days d
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
