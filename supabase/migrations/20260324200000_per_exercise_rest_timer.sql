-- Add per-exercise and per-template rest timer support

-- 1. Add rest_timer_seconds columns
ALTER TABLE gym_templates ADD COLUMN rest_timer_seconds integer DEFAULT NULL;
ALTER TABLE gym_template_exercises ADD COLUMN rest_timer_seconds integer DEFAULT NULL;

-- 2. Update gym_save_template to accept rest_timer_seconds
DROP FUNCTION IF EXISTS gym_save_template(jsonb, text, jsonb);

CREATE FUNCTION gym_save_template(
  p_exercises jsonb,
  p_name text,
  p_phases jsonb DEFAULT '[]'::jsonb,
  p_rest_timer_seconds integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_template_id uuid;
  v_phase jsonb;
BEGIN
  -- Shift existing templates down
  UPDATE gym_templates SET sort_order = sort_order + 1 WHERE user_id = auth.uid();

  INSERT INTO gym_templates (name, sort_order, rest_timer_seconds)
  VALUES (p_name, 0, p_rest_timer_seconds)
  RETURNING id INTO v_template_id;

  INSERT INTO gym_template_exercises (template_id, exercise_id, position, superset_id, rest_timer_seconds)
  SELECT
    v_template_id,
    (elem->>'exercise_id')::uuid,
    ordinality - 1,
    nullif(elem->>'superset_id', '')::uuid,
    (elem->>'rest_timer_seconds')::integer
  FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality);

  FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases)
  LOOP
    INSERT INTO gym_template_phases (template_id, phase_type, activity_id, user_id)
    VALUES (
      v_template_id,
      v_phase->>'phase_type',
      (v_phase->>'activity_id')::uuid,
      auth.uid()
    );
  END LOOP;

  RETURN v_template_id;
END;
$$;

-- 3. Update gym_edit_template to accept rest_timer_seconds
DROP FUNCTION IF EXISTS gym_edit_template(uuid, jsonb, text, jsonb);

CREATE FUNCTION gym_edit_template(
  p_id uuid,
  p_exercises jsonb,
  p_name text,
  p_phases jsonb DEFAULT '[]'::jsonb,
  p_rest_timer_seconds integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_phase jsonb;
BEGIN
  UPDATE gym_templates
  SET name = p_name, updated_at = now(), rest_timer_seconds = p_rest_timer_seconds
  WHERE id = p_id AND user_id = auth.uid();

  DELETE FROM gym_template_exercises WHERE template_id = p_id;

  INSERT INTO gym_template_exercises (template_id, exercise_id, position, superset_id, rest_timer_seconds)
  SELECT
    p_id,
    (elem->>'exercise_id')::uuid,
    ordinality - 1,
    nullif(elem->>'superset_id', '')::uuid,
    (elem->>'rest_timer_seconds')::integer
  FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality);

  DELETE FROM gym_template_phases WHERE template_id = p_id;

  FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases)
  LOOP
    INSERT INTO gym_template_phases (template_id, phase_type, activity_id, user_id)
    VALUES (
      p_id,
      v_phase->>'phase_type',
      (v_phase->>'activity_id')::uuid,
      auth.uid()
    );
  END LOOP;

  RETURN p_id;
END;
$$;
