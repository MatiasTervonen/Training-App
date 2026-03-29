-- Add per-day default rest timer to training_plan_days.
-- If an exercise doesn't have its own rest_timer_seconds, the day's value is used.

ALTER TABLE training_plan_days
  ADD COLUMN rest_timer_seconds INTEGER;

-- ============================================================
-- Update save RPC to store day-level rest_timer_seconds
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
    INSERT INTO training_plan_days (plan_id, position, label, rest_timer_seconds)
    VALUES (
      v_plan_id,
      (v_day->>'position')::INTEGER,
      v_day->>'label',
      (v_day->>'rest_timer_seconds')::INTEGER
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

-- ============================================================
-- Update update RPC to store day-level rest_timer_seconds
-- ============================================================
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
    INSERT INTO training_plan_days (plan_id, position, label, rest_timer_seconds)
    VALUES (
      p_plan_id,
      (v_day->>'position')::INTEGER,
      v_day->>'label',
      (v_day->>'rest_timer_seconds')::INTEGER
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

-- ============================================================
-- Update get_current RPC to return day-level rest_timer_seconds
-- ============================================================
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

  SELECT d.id, d.label, d.position, d.rest_timer_seconds
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
    'day_rest_timer_seconds', v_day.rest_timer_seconds,
    'exercises', v_exercises,
    'targets', v_targets
  );
END;
$$;

-- ============================================================
-- Update get_full RPC to return day-level rest_timer_seconds
-- ============================================================
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
      'rest_timer_seconds', d.rest_timer_seconds,
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
