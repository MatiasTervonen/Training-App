-- Add sort_order to gym_templates and activity_templates for drag-to-reorder

-- 1. Add columns
ALTER TABLE gym_templates ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE activity_templates ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- 2. Initialize sort_order based on current created_at DESC ordering
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM gym_templates
)
UPDATE gym_templates SET sort_order = ranked.rn FROM ranked WHERE gym_templates.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM activity_templates
)
UPDATE activity_templates SET sort_order = ranked.rn FROM ranked WHERE activity_templates.id = ranked.id;

-- 3. Update gym_save_template to assign sort_order = 0 (top) and shift others
DROP FUNCTION IF EXISTS gym_save_template(jsonb, text, jsonb);

CREATE FUNCTION gym_save_template(
  p_exercises jsonb,
  p_name text,
  p_phases jsonb DEFAULT '[]'::jsonb
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

  INSERT INTO gym_templates (name, sort_order)
  VALUES (p_name, 0)
  RETURNING id INTO v_template_id;

  INSERT INTO gym_template_exercises (template_id, exercise_id, position, superset_id)
  SELECT
    v_template_id,
    (elem->>'exercise_id')::uuid,
    ordinality - 1,
    nullif(elem->>'superset_id', '')::uuid
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

-- 4. Update activities_save_template to assign sort_order = 0 (top) and shift others
DROP FUNCTION IF EXISTS activities_save_template(text, text, uuid);

CREATE FUNCTION activities_save_template(p_name text, p_notes text, p_session_id uuid) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Shift existing templates down
  UPDATE activity_templates SET sort_order = sort_order + 1 WHERE user_id = auth.uid();

  INSERT INTO activity_templates (
    user_id, activity_id, name, notes, geom, distance_meters, sort_order
  )
  SELECT
    s.user_id, s.activity_id, p_name, p_notes, s.geom, st.distance_meters, 0
  FROM sessions s
  JOIN session_stats st ON st.session_id = s.id
  WHERE s.id = p_session_id
    AND s.user_id = auth.uid()
    AND s.geom IS NOT NULL
  RETURNING id INTO v_template_id;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not owned by user';
  END IF;

  UPDATE sessions s
  SET template_id = v_template_id
  WHERE s.id = p_session_id
    AND s.user_id = auth.uid();

  RETURN v_template_id;
END;
$$;

-- 5. Update activities_get_templates to order by sort_order
DROP FUNCTION IF EXISTS activities_get_templates();

CREATE FUNCTION activities_get_templates() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path TO 'public', 'extensions'
AS $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'template',
        to_jsonb(t) - 'geom'
          || jsonb_build_object(
            'last_completed_at', agg.last_completed_at,
            'times_completed', coalesce(agg.times_completed, 0),
            'avg_duration', agg.avg_duration,
            'avg_pace', agg.avg_pace,
            'avg_speed', agg.avg_speed,
            'avg_distance', agg.avg_distance
          ),
        'activity',
        jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'slug', a.slug,
          'base_met', a.base_met,
          'is_gps_relevant', a.is_gps_relevant,
          'is_step_relevant', a.is_step_relevant,
          'is_calories_relevant', a.is_calories_relevant
        ),
        'route',
        case
          when t.geom is not null
          then ST_AsGeoJSON(t.geom)::jsonb
          else null
        end
      )
      order by t.sort_order asc
    ),
    '[]'::jsonb
  )
  from activity_templates t
  join activities a on t.activity_id = a.id
  left join lateral (
    select
      max(s.start_time) as last_completed_at,
      count(*)::int as times_completed,
      avg(s.duration) as avg_duration,
      avg(ss.avg_pace) filter (where ss.avg_pace is not null) as avg_pace,
      avg(ss.avg_speed) filter (where ss.avg_speed is not null) as avg_speed,
      avg(ss.distance_meters) filter (where ss.distance_meters is not null) as avg_distance
    from sessions s
    join session_stats ss on ss.session_id = s.id
    where s.template_id = t.id
      and s.user_id = auth.uid()
  ) agg on true
  where t.user_id = auth.uid();
$$;

-- 6. Create reorder RPCs
CREATE FUNCTION gym_reorder_templates(p_ids uuid[]) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE gym_templates
  SET sort_order = t.new_order - 1
  FROM unnest(p_ids) WITH ORDINALITY AS t(id, new_order)
  WHERE gym_templates.id = t.id
    AND gym_templates.user_id = auth.uid();
END;
$$;

CREATE FUNCTION activities_reorder_templates(p_ids uuid[]) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE activity_templates
  SET sort_order = t.new_order - 1
  FROM unnest(p_ids) WITH ORDINALITY AS t(id, new_order)
  WHERE activity_templates.id = t.id
    AND activity_templates.user_id = auth.uid();
END;
$$;
