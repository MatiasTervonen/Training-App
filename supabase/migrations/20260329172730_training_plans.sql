-- Training Plans: tables, RLS, and RPC functions

-- ============================================================
-- Table: training_plans
-- ============================================================
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  is_active BOOLEAN NOT NULL DEFAULT false,
  total_weeks INTEGER,
  current_week INTEGER NOT NULL DEFAULT 1,
  current_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_plans_user_active ON training_plans (user_id, is_active);

-- ============================================================
-- Table: training_plan_days
-- ============================================================
CREATE TABLE training_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES gym_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label TEXT CHECK (char_length(label) <= 100),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_id, position)
);

CREATE INDEX idx_training_plan_days_plan ON training_plan_days (plan_id, position);

-- ============================================================
-- Table: training_plan_targets
-- ============================================================
CREATE TABLE training_plan_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES training_plan_days(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id) ON DELETE CASCADE,
  exercise_position INTEGER NOT NULL DEFAULT 0,
  set_number INTEGER NOT NULL,
  target_weight NUMERIC(7,2),
  target_reps INTEGER,
  target_rpe TEXT CHECK (char_length(target_rpe) <= 20),
  notes TEXT CHECK (char_length(notes) <= 500),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (plan_day_id, week_number, exercise_id, set_number)
);

CREATE INDEX idx_training_plan_targets_lookup
  ON training_plan_targets (plan_day_id, week_number);

-- ============================================================
-- RLS Policies
-- ============================================================

-- training_plans
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plans_select" ON training_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plans_insert" ON training_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plans_update" ON training_plans
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plans_delete" ON training_plans
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- training_plan_days
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plan_days_select" ON training_plan_days
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_days_insert" ON training_plan_days
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "training_plan_days_update" ON training_plan_days
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "training_plan_days_delete" ON training_plan_days
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- training_plan_targets
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
-- RPC: training_plan_save
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
  v_target JSONB;
  v_day_ids JSONB := '{}'::JSONB;
BEGIN
  INSERT INTO training_plans (name, total_weeks)
  VALUES (p_name, p_total_weeks)
  RETURNING id INTO v_plan_id;

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

-- ============================================================
-- RPC: training_plan_update
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
  v_target JSONB;
  v_day_ids JSONB := '{}'::JSONB;
BEGIN
  UPDATE training_plans
  SET name = p_name, total_weeks = p_total_weeks, updated_at = now()
  WHERE id = p_plan_id AND user_id = auth.uid();

  DELETE FROM training_plan_days WHERE plan_id = p_plan_id;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_days) LOOP
    INSERT INTO training_plan_days (plan_id, template_id, position, label)
    VALUES (
      p_plan_id,
      (v_day->>'template_id')::UUID,
      (v_day->>'position')::INTEGER,
      v_day->>'label'
    )
    RETURNING id INTO v_day_id;

    v_day_ids := v_day_ids || jsonb_build_object((v_day->>'position')::TEXT, v_day_id::TEXT);
  END LOOP;

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
END;
$$;

-- ============================================================
-- RPC: training_plan_activate
-- ============================================================
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

-- ============================================================
-- RPC: training_plan_deactivate
-- ============================================================
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

-- ============================================================
-- RPC: training_plan_advance
-- ============================================================
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

-- ============================================================
-- RPC: training_plan_get_current
-- ============================================================
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

  SELECT d.id, d.template_id, d.label, d.position,
         t.name AS template_name
  INTO v_day
  FROM training_plan_days d
  JOIN gym_templates t ON t.id = d.template_id
  WHERE d.plan_id = v_plan.id AND d.position = v_plan.current_position;

  IF v_day IS NULL THEN
    RETURN NULL;
  END IF;

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

-- ============================================================
-- RPC: training_plan_get_full
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
