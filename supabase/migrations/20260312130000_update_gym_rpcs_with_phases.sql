-- ============================================================
-- Update gym RPCs to support warm-up/cool-down phases
-- ============================================================

-- ---- gym_save_session with phases ----
DROP FUNCTION IF EXISTS gym_save_session(jsonb, text, integer, text, timestamptz, timestamptz, jsonb, jsonb, jsonb);

CREATE FUNCTION gym_save_session(
  p_exercises jsonb,
  p_notes text,
  p_duration integer,
  p_title text,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb,
  p_phases jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise jsonb;
  v_sets jsonb;
  v_position integer;
  v_set_number integer;
  v_total_volume numeric;
  v_phase jsonb;
  v_phase_met numeric;
  v_phase_calories numeric;
  v_total_phase_seconds integer := 0;
  v_total_phase_calories numeric := 0;
  v_gym_met numeric;
  v_user_weight_kg numeric;
  v_lifting_seconds integer;
  v_gym_calories numeric;
BEGIN
  -- Validate media counts
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  INSERT INTO sessions (title, notes, duration, start_time, end_time, activity_id)
  VALUES (p_title, p_notes, p_duration, p_start_time, p_end_time, (SELECT id FROM activities WHERE slug = 'gym'))
  RETURNING id INTO v_session_id;

  FOR v_exercise, v_position IN
    SELECT elem, ordinality - 1
    FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality)
  LOOP
    INSERT INTO gym_session_exercises (session_id, exercise_id, position, superset_id, notes)
    VALUES (
      v_session_id, (v_exercise->>'exercise_id')::uuid, v_position,
      nullif(v_exercise->>'superset_id', '')::uuid, v_exercise->>'notes'
    ) RETURNING id INTO v_session_exercise_id;

    FOR v_sets, v_set_number IN
      SELECT elem, ordinality - 1
      FROM jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ordinality)
    LOOP
      INSERT INTO gym_sets (session_exercise_id, weight, reps, rpe, set_number, time_min, distance_meters)
      VALUES (
        v_session_exercise_id, (v_sets->>'weight')::numeric, (v_sets->>'reps')::integer,
        (v_sets->>'rpe')::text, v_set_number, (v_sets->>'time_min')::numeric, (v_sets->>'distance_meters')::numeric
      );
    END LOOP;
  END LOOP;

  INSERT INTO sessions_voice (storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', v_session_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_recordings) AS r;

  INSERT INTO session_images (storage_path, session_id)
  SELECT r->>'storage_path', v_session_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO session_videos (storage_path, thumbnail_storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_session_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  v_total_volume := (
    SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
    FROM jsonb_array_elements(p_exercises) AS e,
         jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
    WHERE (s->>'weight') IS NOT NULL AND (s->>'reps') IS NOT NULL
  );

  -- Get user weight for calorie calculations
  SELECT coalesce(
    (SELECT weight FROM weight WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1),
    70
  ) INTO v_user_weight_kg;

  -- Get gym base MET
  SELECT base_met INTO v_gym_met FROM activities WHERE slug = 'gym';

  -- Insert phases and compute per-phase calories
  FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases)
  LOOP
    SELECT base_met INTO v_phase_met FROM activities WHERE id = (v_phase->>'activity_id')::uuid;
    v_phase_met := COALESCE(v_phase_met, v_gym_met);
    v_phase_calories := v_phase_met * v_user_weight_kg * ((v_phase->>'duration_seconds')::integer / 3600.0);
    v_total_phase_seconds := v_total_phase_seconds + (v_phase->>'duration_seconds')::integer;
    v_total_phase_calories := v_total_phase_calories + v_phase_calories;

    INSERT INTO gym_session_phases (session_id, phase_type, activity_id, duration_seconds, steps, distance_meters, calories, is_manual, user_id)
    VALUES (
      v_session_id,
      v_phase->>'phase_type',
      (v_phase->>'activity_id')::uuid,
      (v_phase->>'duration_seconds')::integer,
      (v_phase->>'steps')::integer,
      (v_phase->>'distance_meters')::numeric,
      v_phase_calories,
      COALESCE((v_phase->>'is_manual')::boolean, false),
      auth.uid()
    );
  END LOOP;

  -- Compute stats: call the standard function first
  PERFORM activities_compute_session_stats(v_session_id, null);

  -- Override calories if phases exist
  IF v_total_phase_seconds > 0 THEN
    v_lifting_seconds := GREATEST(p_duration - v_total_phase_seconds, 0);
    v_gym_calories := v_gym_met * v_user_weight_kg * (v_lifting_seconds / 3600.0);
    UPDATE session_stats
    SET calories = v_gym_calories + v_total_phase_calories
    WHERE session_id = v_session_id;
  END IF;

  UPDATE session_stats SET total_volume = v_total_volume WHERE session_id = v_session_id;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title, 'gym_sessions',
    jsonb_build_object(
      'start_time', p_start_time, 'end_time', p_end_time, 'duration', p_duration,
      'exercises_count', jsonb_array_length(p_exercises),
      'sets_count', (SELECT coalesce(sum(jsonb_array_length(e->'sets')), 0) FROM jsonb_array_elements(p_exercises) AS t(e)),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos),
      'voice-count', jsonb_array_length(p_recordings)
    ),
    v_session_id, p_start_time
  );

  RETURN v_session_id;
END;
$$;

-- ---- gym_edit_session with phases ----
DROP FUNCTION IF EXISTS gym_edit_session(jsonb, text, integer, text, uuid, timestamptz, uuid[], jsonb, uuid[], jsonb, uuid[], jsonb);

CREATE FUNCTION gym_edit_session(
  p_exercises jsonb,
  p_notes text,
  p_duration integer,
  p_title text,
  p_id uuid,
  p_updated_at timestamp with time zone,
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_new_images jsonb DEFAULT '[]'::jsonb,
  p_deleted_video_ids uuid[] DEFAULT '{}',
  p_new_videos jsonb DEFAULT '[]'::jsonb,
  p_deleted_recording_ids uuid[] DEFAULT '{}',
  p_new_recordings jsonb DEFAULT '[]'::jsonb,
  p_phases jsonb DEFAULT '[]'::jsonb
) RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise jsonb;
  v_sets jsonb;
  v_position integer;
  v_set_number integer;
  v_feed_item feed_items;
  v_total_volume numeric;
  v_image_count integer;
  v_video_count integer;
  v_voice_count integer;
  v_existing_images integer;
  v_existing_videos integer;
  v_existing_voice integer;
  v_phase jsonb;
  v_phase_met numeric;
  v_phase_calories numeric;
  v_total_phase_seconds integer := 0;
  v_total_phase_calories numeric := 0;
  v_gym_met numeric;
  v_user_weight_kg numeric;
  v_lifting_seconds integer;
  v_gym_calories numeric;
BEGIN
  -- Validate media counts (existing - deleted + new)
  SELECT count(*) INTO v_existing_images FROM session_images WHERE session_id = p_id;
  SELECT count(*) INTO v_existing_videos FROM session_videos WHERE session_id = p_id;
  SELECT count(*) INTO v_existing_voice FROM sessions_voice WHERE session_id = p_id;

  IF (v_existing_images - COALESCE(array_length(p_deleted_image_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_images, '[]'::jsonb))) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF (v_existing_videos - COALESCE(array_length(p_deleted_video_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_videos, '[]'::jsonb))) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF (v_existing_voice - COALESCE(array_length(p_deleted_recording_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_recordings, '[]'::jsonb))) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  UPDATE sessions
  SET title = p_title, notes = p_notes, duration = p_duration, updated_at = p_updated_at
  WHERE id = p_id
  RETURNING id INTO v_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  DELETE FROM gym_sets WHERE session_exercise_id IN (SELECT id FROM gym_session_exercises WHERE session_id = v_session_id);
  DELETE FROM gym_session_exercises WHERE session_id = v_session_id;

  FOR v_exercise, v_position IN
    SELECT elem, ordinality - 1
    FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality)
  LOOP
    INSERT INTO gym_session_exercises (session_id, exercise_id, position, superset_id, notes)
    VALUES (
      v_session_id, (v_exercise->>'exercise_id')::uuid, v_position,
      nullif(v_exercise->>'superset_id', '')::uuid, v_exercise->>'notes'
    ) RETURNING id INTO v_session_exercise_id;

    FOR v_sets, v_set_number IN
      SELECT elem, ordinality - 1
      FROM jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ordinality)
    LOOP
      INSERT INTO gym_sets (session_exercise_id, weight, reps, rpe, set_number, time_min, distance_meters)
      VALUES (
        v_session_exercise_id, (v_sets->>'weight')::numeric, (v_sets->>'reps')::integer,
        (v_sets->>'rpe')::text, v_set_number, (v_sets->>'time_min')::numeric, (v_sets->>'distance_meters')::numeric
      );
    END LOOP;
  END LOOP;

  IF array_length(p_deleted_recording_ids, 1) > 0 THEN
    DELETE FROM sessions_voice WHERE id = ANY(p_deleted_recording_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_recordings) > 0 THEN
    INSERT INTO sessions_voice (storage_path, session_id, duration_ms)
    SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_recordings) AS r;
  END IF;

  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM session_images WHERE id = ANY(p_deleted_image_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_images) > 0 THEN
    INSERT INTO session_images (storage_path, session_id)
    SELECT r->>'storage_path', p_id
    FROM jsonb_array_elements(p_new_images) AS r;
  END IF;

  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM session_videos WHERE id = ANY(p_deleted_video_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_videos) > 0 THEN
    INSERT INTO session_videos (storage_path, thumbnail_storage_path, session_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_videos) AS r;
  END IF;

  v_total_volume := (
    SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
    FROM jsonb_array_elements(p_exercises) AS e,
         jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
    WHERE (s->>'weight') IS NOT NULL AND (s->>'reps') IS NOT NULL
  );

  -- Delete existing phases and re-insert
  DELETE FROM gym_session_phases WHERE session_id = v_session_id;

  -- Get user weight and gym MET
  SELECT coalesce(
    (SELECT weight FROM weight WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1),
    70
  ) INTO v_user_weight_kg;

  SELECT base_met INTO v_gym_met FROM activities WHERE slug = 'gym';

  -- Insert phases and compute per-phase calories
  FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases)
  LOOP
    SELECT base_met INTO v_phase_met FROM activities WHERE id = (v_phase->>'activity_id')::uuid;
    v_phase_met := COALESCE(v_phase_met, v_gym_met);
    v_phase_calories := v_phase_met * v_user_weight_kg * ((v_phase->>'duration_seconds')::integer / 3600.0);
    v_total_phase_seconds := v_total_phase_seconds + (v_phase->>'duration_seconds')::integer;
    v_total_phase_calories := v_total_phase_calories + v_phase_calories;

    INSERT INTO gym_session_phases (session_id, phase_type, activity_id, duration_seconds, steps, distance_meters, calories, is_manual, user_id)
    VALUES (
      v_session_id,
      v_phase->>'phase_type',
      (v_phase->>'activity_id')::uuid,
      (v_phase->>'duration_seconds')::integer,
      (v_phase->>'steps')::integer,
      (v_phase->>'distance_meters')::numeric,
      v_phase_calories,
      COALESCE((v_phase->>'is_manual')::boolean, false),
      auth.uid()
    );
  END LOOP;

  -- Override calories if phases exist
  IF v_total_phase_seconds > 0 THEN
    v_lifting_seconds := GREATEST(p_duration - v_total_phase_seconds, 0);
    v_gym_calories := v_gym_met * v_user_weight_kg * (v_lifting_seconds / 3600.0);
    UPDATE session_stats
    SET calories = v_gym_calories + v_total_phase_calories
    WHERE session_id = v_session_id;
  END IF;

  UPDATE session_stats SET total_volume = v_total_volume WHERE session_id = v_session_id;

  SELECT count(*) INTO v_image_count FROM session_images WHERE session_id = p_id;
  SELECT count(*) INTO v_video_count FROM session_videos WHERE session_id = p_id;
  SELECT count(*) INTO v_voice_count FROM sessions_voice WHERE session_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'duration', p_duration,
        'exercises_count', jsonb_array_length(p_exercises),
        'sets_count', (SELECT coalesce(sum(jsonb_array_length(e->'sets')), 0) FROM jsonb_array_elements(p_exercises) AS t(e)),
        'image-count', v_image_count, 'video-count', v_video_count, 'voice-count', v_voice_count
      )
  WHERE source_id = p_id AND type = 'gym_sessions'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;

-- ---- gym_save_template with phases ----
DROP FUNCTION IF EXISTS gym_save_template(jsonb, text);

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
  INSERT INTO gym_templates (name)
  VALUES (p_name)
  RETURNING id INTO v_template_id;

  INSERT INTO gym_template_exercises (template_id, exercise_id, position, superset_id)
  SELECT
    v_template_id,
    (elem->>'exercise_id')::uuid,
    ordinality - 1,
    nullif(elem->>'superset_id', '')::uuid
  FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality);

  -- Insert template phases
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

-- ---- gym_edit_template with phases ----
DROP FUNCTION IF EXISTS gym_edit_template(uuid, jsonb, text);

CREATE FUNCTION gym_edit_template(
  p_id uuid,
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
  UPDATE gym_templates
  SET name = p_name, updated_at = now()
  WHERE id = p_id
  RETURNING id INTO v_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  DELETE FROM gym_template_exercises WHERE template_id = v_template_id;

  INSERT INTO gym_template_exercises (template_id, exercise_id, position, superset_id)
  SELECT
    v_template_id,
    (elem->>'exercise_id')::uuid,
    ordinality - 1,
    nullif(elem->>'superset_id', '')::uuid
  FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality);

  -- Delete and re-insert phases
  DELETE FROM gym_template_phases WHERE template_id = v_template_id;

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
