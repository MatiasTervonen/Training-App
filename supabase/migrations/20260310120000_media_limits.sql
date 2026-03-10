-- ============================================================
-- Media Limits Migration
-- Sets file size limits on storage buckets and adds media count
-- validation to all save/edit RPC functions.
-- ============================================================

-- 1. Storage bucket file size limits
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'notes-images';    -- 10 MB
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'media-videos';    -- 100 MB
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'notes-voice';     -- 10 MB
UPDATE storage.buckets SET file_size_limit = 10485760  WHERE id = 'feedback-images'; -- 10 MB

-- ============================================================
-- 2. Save functions with media count validation
-- ============================================================

-- ---- activities_save_activity ----
DROP FUNCTION IF EXISTS activities_save_activity(text, text, integer, timestamptz, timestamptz, jsonb, uuid, integer, jsonb, jsonb, jsonb, uuid);

CREATE FUNCTION activities_save_activity(
  p_title text,
  p_notes text,
  p_duration integer,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_track jsonb,
  p_activity_id uuid,
  p_steps integer,
  p_draftrecordings jsonb DEFAULT '[]'::jsonb,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_template_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_activity_id uuid;
  v_activity_name text;
  v_activity_slug text;
  v_track jsonb;
  v_position integer;
  v_distance numeric;
BEGIN
  -- Validate media counts
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_draftrecordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  INSERT INTO sessions (
    title, notes, duration, start_time, end_time, activity_id, template_id
  ) VALUES (
    p_title, p_notes, p_duration, p_start_time, p_end_time, p_activity_id, p_template_id
  ) RETURNING id INTO v_activity_id;

  INSERT INTO sessions_voice (storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', v_activity_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_draftRecordings) AS r;

  INSERT INTO session_images (storage_path, session_id)
  SELECT r->>'storage_path', v_activity_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO session_videos (storage_path, thumbnail_storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_activity_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  IF p_track IS NOT NULL THEN
    FOR v_track, v_position IN
      SELECT elem, ordinality - 1
      FROM jsonb_array_elements(p_track) WITH ORDINALITY AS t(elem, ordinality)
    LOOP
      INSERT INTO activity_gps_points (
        session_id, recorded_at, latitude, longitude, accuracy, altitude, is_stationary, bad_signal
      ) VALUES (
        v_activity_id,
        (v_track->>'timestamp')::timestamptz,
        (v_track->>'latitude')::numeric,
        (v_track->>'longitude')::numeric,
        (v_track->>'accuracy')::numeric,
        (v_track->>'altitude')::numeric,
        coalesce((v_track->>'is_stationary')::boolean, false),
        coalesce((v_track->>'bad_signal')::boolean, false)
      );
    END LOOP;
  END IF;

  IF p_track IS NOT NULL THEN
    UPDATE sessions s
    SET geom = (
      WITH points_with_gaps AS (
        SELECT
          p.longitude, p.latitude, p.recorded_at, p.is_stationary, p.bad_signal,
          CASE
            WHEN extract(epoch FROM (p.recorded_at - lag(p.recorded_at) OVER (ORDER BY p.recorded_at))) > 60
                 AND ST_DistanceSphere(
                   ST_MakePoint(p.longitude, p.latitude),
                   ST_MakePoint(
                     lag(p.longitude) OVER (ORDER BY p.recorded_at),
                     lag(p.latitude) OVER (ORDER BY p.recorded_at)
                   )
                 ) > 100
            THEN 1 ELSE 0
          END AS is_gap
        FROM activity_gps_points p
        WHERE p.session_id = v_activity_id
      ),
      points_with_segments AS (
        SELECT longitude, latitude, recorded_at, is_stationary, bad_signal,
          sum(is_gap) OVER (ORDER BY recorded_at) AS segment_id
        FROM points_with_gaps
      ),
      segment_lines AS (
        SELECT segment_id,
          ST_MakeLine(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) ORDER BY recorded_at) AS line
        FROM points_with_segments
        WHERE NOT is_stationary AND NOT bad_signal
        GROUP BY segment_id HAVING count(*) >= 2
      )
      SELECT
        CASE
          WHEN count(*) = 1 THEN (array_agg(line))[1]::geography
          ELSE ST_Collect(line ORDER BY segment_id)::geography
        END
      FROM segment_lines
    )
    WHERE s.id = v_activity_id;
  END IF;

  PERFORM activities_compute_session_stats(v_activity_id, p_steps);

  IF p_track IS NOT NULL THEN
    SELECT distance_meters INTO v_distance FROM session_stats WHERE session_id = v_activity_id;
  END IF;

  SELECT name, slug INTO v_activity_name, v_activity_slug FROM activities WHERE id = p_activity_id;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title, 'activity_sessions',
    jsonb_build_object(
      'duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time,
      'distance', v_distance, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug,
      'voice_count', jsonb_array_length(p_draftRecordings),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos)
    ),
    v_activity_id, p_start_time
  );

  RETURN v_activity_id;
END;
$$;

-- ---- gym_save_session ----
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
  p_recordings jsonb DEFAULT '[]'::jsonb
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

  PERFORM activities_compute_session_stats(v_session_id, null);

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

-- ---- notes_save_note ----
DROP FUNCTION IF EXISTS notes_save_note(text, text, jsonb, uuid, jsonb, jsonb);

CREATE FUNCTION notes_save_note(
  p_title text,
  p_notes text,
  p_draftrecordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_note_id uuid;
BEGIN
  -- Validate media counts
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF jsonb_array_length(COALESCE(p_draftrecordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  INSERT INTO notes (title, notes, folder_id)
  VALUES (p_title, p_notes, p_folder_id)
  RETURNING id INTO v_note_id;

  INSERT INTO notes_voice (storage_path, note_id, duration_ms)
  SELECT r->>'storage_path', v_note_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_draftrecordings) AS r;

  INSERT INTO notes_images (storage_path, note_id)
  SELECT r->>'storage_path', v_note_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO notes_videos (storage_path, thumbnail_storage_path, note_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_note_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title, 'notes',
    jsonb_build_object(
      'notes', p_notes,
      'voice-count', jsonb_array_length(p_draftrecordings),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos),
      'folder_id', p_folder_id
    ),
    v_note_id, now()
  );

  RETURN v_note_id;
END;
$$;

-- ---- todo_save_todo ----
DROP FUNCTION IF EXISTS todo_save_todo(text, jsonb);

CREATE FUNCTION todo_save_todo(
  p_title text,
  p_todo_list jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_todo_id uuid;
  v_task_id uuid;
  v_task jsonb;
  v_position integer := 0;
  v_voice_count integer := 0;
  v_image_count integer := 0;
  v_video_count integer := 0;
BEGIN
  -- Validate per-task media counts
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_todo_list)
  LOOP
    IF v_task->'images' IS NOT NULL AND jsonb_array_length(v_task->'images') > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images per task';
    END IF;
    IF v_task->'videos' IS NOT NULL AND jsonb_array_length(v_task->'videos') > 3 THEN
      RAISE EXCEPTION 'Maximum 3 videos per task';
    END IF;
    IF v_task->'voice' IS NOT NULL AND jsonb_array_length(v_task->'voice') > 5 THEN
      RAISE EXCEPTION 'Maximum 5 voice recordings per task';
    END IF;
  END LOOP;

  INSERT INTO todo_lists (title)
  VALUES (p_title)
  RETURNING id INTO v_todo_id;

  -- Reset position counter for actual inserts
  v_position := 0;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_todo_list)
  LOOP
    INSERT INTO todo_tasks (list_id, task, notes, position)
    VALUES (v_todo_id, v_task->>'task', v_task->>'notes', v_position)
    RETURNING id INTO v_task_id;

    IF v_task->'voice' IS NOT NULL AND jsonb_array_length(v_task->'voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'voice') AS r;
      v_voice_count := v_voice_count + jsonb_array_length(v_task->'voice');
    END IF;

    IF v_task->'images' IS NOT NULL AND jsonb_array_length(v_task->'images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'images') AS r;
      v_image_count := v_image_count + jsonb_array_length(v_task->'images');
    END IF;

    IF v_task->'videos' IS NOT NULL AND jsonb_array_length(v_task->'videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'videos') AS r;
      v_video_count := v_video_count + jsonb_array_length(v_task->'videos');
    END IF;

    v_position := v_position + 1;
  END LOOP;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title, 'todo_lists',
    jsonb_build_object(
      'completed', 0, 'total', jsonb_array_length(p_todo_list),
      'voice-count', v_voice_count, 'image-count', v_image_count, 'video-count', v_video_count
    ),
    v_todo_id, now()
  );

  RETURN v_todo_id;
END;
$$;

-- ---- weight_save_weight ----
DROP FUNCTION IF EXISTS weight_save_weight(text, text, numeric, jsonb, jsonb, jsonb);

CREATE FUNCTION weight_save_weight(
  p_title text,
  p_notes text,
  p_weight numeric,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_weight_id uuid;
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

  INSERT INTO weight (title, notes, weight)
  VALUES (p_title, p_notes, p_weight)
  RETURNING id INTO v_weight_id;

  INSERT INTO weight_voice (storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', v_weight_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_recordings) AS r;

  INSERT INTO weight_images (storage_path, weight_id)
  SELECT r->>'storage_path', v_weight_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO weight_videos (storage_path, thumbnail_storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_weight_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title, 'weight',
    jsonb_build_object(
      'notes', p_notes, 'weight', p_weight,
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos),
      'voice-count', jsonb_array_length(p_recordings)
    ),
    v_weight_id, now()
  );

  RETURN v_weight_id;
END;
$$;

-- ============================================================
-- 3. Edit functions with media count validation
-- ============================================================

-- ---- notes_edit_note ----
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb, uuid, uuid[], jsonb, uuid[], jsonb);

CREATE FUNCTION notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] DEFAULT '{}',
  p_new_recordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL,
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_new_images jsonb DEFAULT '[]'::jsonb,
  p_deleted_video_ids uuid[] DEFAULT '{}',
  p_new_videos jsonb DEFAULT '[]'::jsonb
) RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_feed_item feed_items;
  v_voice_count integer;
  v_image_count integer;
  v_video_count integer;
  v_existing_voice integer;
  v_existing_images integer;
  v_existing_videos integer;
BEGIN
  -- Validate media counts (existing - deleted + new)
  SELECT count(*) INTO v_existing_voice FROM notes_voice WHERE note_id = p_id;
  SELECT count(*) INTO v_existing_images FROM notes_images WHERE note_id = p_id;
  SELECT count(*) INTO v_existing_videos FROM notes_videos WHERE note_id = p_id;

  IF (v_existing_images - COALESCE(array_length(p_deleted_image_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_images, '[]'::jsonb))) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF (v_existing_videos - COALESCE(array_length(p_deleted_video_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_videos, '[]'::jsonb))) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF (v_existing_voice - COALESCE(array_length(p_deleted_recording_ids, 1), 0) + jsonb_array_length(COALESCE(p_new_recordings, '[]'::jsonb))) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  UPDATE notes
  SET title = p_title, notes = p_notes, folder_id = p_folder_id, updated_at = p_updated_at
  WHERE id = p_id;

  IF array_length(p_deleted_recording_ids, 1) > 0 THEN
    DELETE FROM notes_voice WHERE id = ANY(p_deleted_recording_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_recordings) > 0 THEN
    INSERT INTO notes_voice (storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_recordings) AS r;
  END IF;

  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM notes_images WHERE id = ANY(p_deleted_image_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_images) > 0 THEN
    INSERT INTO notes_images (storage_path, note_id)
    SELECT r->>'storage_path', p_id
    FROM jsonb_array_elements(p_new_images) AS r;
  END IF;

  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM notes_videos WHERE id = ANY(p_deleted_video_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_videos) > 0 THEN
    INSERT INTO notes_videos (storage_path, thumbnail_storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_videos) AS r;
  END IF;

  SELECT count(*) INTO v_voice_count FROM notes_voice WHERE note_id = p_id;
  SELECT count(*) INTO v_image_count FROM notes_images WHERE note_id = p_id;
  SELECT count(*) INTO v_video_count FROM notes_videos WHERE note_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'notes', p_notes, 'voice-count', v_voice_count,
        'image-count', v_image_count, 'video-count', v_video_count,
        'folder_id', p_folder_id
      ),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'notes'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;

-- ---- gym_edit_session ----
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
  p_new_recordings jsonb DEFAULT '[]'::jsonb
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

-- ---- todo_edit_todo ----
DROP FUNCTION IF EXISTS todo_edit_todo(uuid, text, jsonb, timestamptz, uuid[], uuid[], uuid[], uuid[]);

CREATE FUNCTION todo_edit_todo(
  p_id uuid,
  p_title text,
  p_tasks jsonb,
  p_updated_at timestamptz,
  p_deleted_ids uuid[] DEFAULT '{}',
  p_deleted_voice_ids uuid[] DEFAULT '{}',
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_deleted_video_ids uuid[] DEFAULT '{}'
) RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_feed_item feed_items;
  v_task jsonb;
  v_task_id uuid;
  v_voice_count integer;
  v_image_count integer;
  v_video_count integer;
  v_completed_count integer;
  v_total_count integer;
  v_existing_images integer;
  v_existing_videos integer;
  v_existing_voice integer;
BEGIN
  -- Validate per-task media counts for existing tasks with new media
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NOT NULL
  LOOP
    v_task_id := (v_task->>'id')::uuid;

    SELECT count(*) INTO v_existing_images FROM todo_task_images WHERE task_id = v_task_id;
    SELECT count(*) INTO v_existing_videos FROM todo_task_videos WHERE task_id = v_task_id;
    SELECT count(*) INTO v_existing_voice FROM todo_task_voice WHERE task_id = v_task_id;

    IF (v_existing_images + COALESCE(jsonb_array_length(v_task->'new_images'), 0)) > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images per task';
    END IF;
    IF (v_existing_videos + COALESCE(jsonb_array_length(v_task->'new_videos'), 0)) > 3 THEN
      RAISE EXCEPTION 'Maximum 3 videos per task';
    END IF;
    IF (v_existing_voice + COALESCE(jsonb_array_length(v_task->'new_voice'), 0)) > 5 THEN
      RAISE EXCEPTION 'Maximum 5 voice recordings per task';
    END IF;
  END LOOP;

  -- Validate per-task media counts for new tasks
  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NULL
  LOOP
    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images per task';
    END IF;
    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 3 THEN
      RAISE EXCEPTION 'Maximum 3 videos per task';
    END IF;
    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 5 THEN
      RAISE EXCEPTION 'Maximum 5 voice recordings per task';
    END IF;
  END LOOP;

  UPDATE todo_lists SET title = p_title, updated_at = p_updated_at WHERE id = p_id;

  UPDATE todo_tasks t
  SET task = src.task, notes = src.notes, position = src.position,
      updated_at = CASE
        WHEN t.task IS DISTINCT FROM src.task OR t.notes IS DISTINCT FROM src.notes
        THEN p_updated_at ELSE t.updated_at
      END
  FROM (
    SELECT (elem->>'id')::uuid AS id, (elem->>'task')::text AS task,
           (elem->>'notes')::text AS notes, (elem->>'position')::integer AS position
    FROM jsonb_array_elements(p_tasks) AS elem
    WHERE elem->>'id' IS NOT NULL
  ) src
  WHERE t.id = src.id AND t.list_id = p_id;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NULL
  LOOP
    INSERT INTO todo_tasks (list_id, task, notes, position)
    VALUES (p_id, v_task->>'task', v_task->>'notes', (v_task->>'position')::integer)
    RETURNING id INTO v_task_id;

    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_voice') AS r;
    END IF;
    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'new_images') AS r;
    END IF;
    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_videos') AS r;
    END IF;
  END LOOP;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) WHERE value->>'id' IS NOT NULL
  LOOP
    v_task_id := (v_task->>'id')::uuid;

    IF v_task->'new_voice' IS NOT NULL AND jsonb_array_length(v_task->'new_voice') > 0 THEN
      INSERT INTO todo_task_voice (storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_voice') AS r;
    END IF;
    IF v_task->'new_images' IS NOT NULL AND jsonb_array_length(v_task->'new_images') > 0 THEN
      INSERT INTO todo_task_images (storage_path, task_id)
      SELECT r->>'storage_path', v_task_id
      FROM jsonb_array_elements(v_task->'new_images') AS r;
    END IF;
    IF v_task->'new_videos' IS NOT NULL AND jsonb_array_length(v_task->'new_videos') > 0 THEN
      INSERT INTO todo_task_videos (storage_path, thumbnail_storage_path, task_id, duration_ms)
      SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_task_id, (r->>'duration_ms')::integer
      FROM jsonb_array_elements(v_task->'new_videos') AS r;
    END IF;
  END LOOP;

  DELETE FROM todo_tasks WHERE list_id = p_id AND id = ANY(p_deleted_ids);

  IF array_length(p_deleted_voice_ids, 1) > 0 THEN
    DELETE FROM todo_task_voice WHERE id = ANY(p_deleted_voice_ids);
  END IF;
  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM todo_task_images WHERE id = ANY(p_deleted_image_ids);
  END IF;
  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM todo_task_videos WHERE id = ANY(p_deleted_video_ids);
  END IF;

  SELECT count(*) INTO v_voice_count
  FROM todo_task_voice WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_image_count
  FROM todo_task_images WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_video_count
  FROM todo_task_videos WHERE task_id IN (SELECT id FROM todo_tasks WHERE list_id = p_id);
  SELECT count(*) INTO v_completed_count FROM todo_tasks WHERE list_id = p_id AND is_completed = true;
  SELECT count(*) INTO v_total_count FROM todo_tasks WHERE list_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'completed', v_completed_count, 'total', v_total_count,
        'voice-count', v_voice_count, 'image-count', v_image_count, 'video-count', v_video_count
      ),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'todo_lists'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;
