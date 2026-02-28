-- Add image and video support to gym + activity sessions (both use sessions table)

-- ============================================================
-- 1. Create session_images table
-- ============================================================

CREATE TABLE session_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session images"
  ON session_images FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session images"
  ON session_images FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session images"
  ON session_images FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. Create session_videos table
-- ============================================================

CREATE TABLE session_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_storage_path TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session videos"
  ON session_videos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session videos"
  ON session_videos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own session videos"
  ON session_videos FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. Update gym_save_session — add media parameters
-- ============================================================

DROP FUNCTION IF EXISTS gym_save_session(jsonb, text, integer, text, timestamp with time zone, timestamp with time zone);

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

  INSERT INTO sessions (
    title,
    notes,
    duration,
    start_time,
    end_time,
    activity_id
  )
  VALUES (
    p_title,
    p_notes,
    p_duration,
    p_start_time,
    p_end_time,
    (SELECT id FROM activities WHERE slug = 'gym')
  )
  RETURNING id INTO v_session_id;

  FOR v_exercise, v_position IN
    SELECT elem, ordinality - 1
    FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality)
  LOOP

    INSERT INTO gym_session_exercises (
      session_id,
      exercise_id,
      position,
      superset_id,
      notes
    )
    VALUES (
      v_session_id,
      (v_exercise->>'exercise_id')::uuid,
      v_position,
      nullif(v_exercise->>'superset_id', '')::uuid,
      v_exercise->>'notes'
    )
    RETURNING id INTO v_session_exercise_id;

    FOR v_sets, v_set_number IN
      SELECT elem, ordinality - 1
      FROM jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ordinality)
    LOOP

      INSERT INTO gym_sets (
        session_exercise_id,
        weight,
        reps,
        rpe,
        set_number,
        time_min,
        distance_meters
      )
      VALUES (
        v_session_exercise_id,
        (v_sets->>'weight')::numeric,
        (v_sets->>'reps')::integer,
        (v_sets->>'rpe')::text,
        v_set_number,
        (v_sets->>'time_min')::numeric,
        (v_sets->>'distance_meters')::numeric
      );

    END LOOP;

  END LOOP;

  -- Insert voice recordings
  INSERT INTO sessions_voice (storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', v_session_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_recordings) AS r;

  -- Insert images
  INSERT INTO session_images (storage_path, session_id)
  SELECT r->>'storage_path', v_session_id
  FROM jsonb_array_elements(p_images) AS r;

  -- Insert videos
  INSERT INTO session_videos (storage_path, thumbnail_storage_path, session_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', v_session_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_videos) AS r;

  -- Compute total volume
  v_total_volume := (
    SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
    FROM jsonb_array_elements(p_exercises) AS e,
         jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
    WHERE (s->>'weight') IS NOT NULL
      AND (s->>'reps') IS NOT NULL
  );

  PERFORM activities_compute_session_stats(v_session_id, null);

  UPDATE session_stats
  SET total_volume = v_total_volume
  WHERE session_id = v_session_id;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'gym_sessions',
    jsonb_build_object(
      'start_time', p_start_time,
      'end_time', p_end_time,
      'duration', p_duration,
      'exercises_count', jsonb_array_length(p_exercises),
      'sets_count', (
        SELECT coalesce(sum(jsonb_array_length(e->'sets')), 0)
        FROM jsonb_array_elements(p_exercises) AS t(e)
      ),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos),
      'voice-count', jsonb_array_length(p_recordings)
    ),
    v_session_id,
    p_start_time
  );

  RETURN v_session_id;
END;
$$;

-- ============================================================
-- 4. Update gym_edit_session — add media delete/new parameters
-- ============================================================

DROP FUNCTION IF EXISTS gym_edit_session(jsonb, text, integer, text, uuid, timestamp with time zone);

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
BEGIN

  UPDATE sessions
  SET
    title = p_title,
    notes = p_notes,
    duration = p_duration,
    updated_at = p_updated_at
  WHERE id = p_id
  RETURNING id INTO v_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  DELETE FROM gym_sets
  WHERE session_exercise_id IN (
    SELECT id FROM gym_session_exercises WHERE session_id = v_session_id
  );

  DELETE FROM gym_session_exercises WHERE session_id = v_session_id;

  FOR v_exercise, v_position IN
    SELECT elem, ordinality - 1
    FROM jsonb_array_elements(p_exercises) WITH ORDINALITY AS t(elem, ordinality)
  LOOP

    INSERT INTO gym_session_exercises (
      session_id,
      exercise_id,
      position,
      superset_id,
      notes
    )
    VALUES (
      v_session_id,
      (v_exercise->>'exercise_id')::uuid,
      v_position,
      nullif(v_exercise->>'superset_id', '')::uuid,
      v_exercise->>'notes'
    )
    RETURNING id INTO v_session_exercise_id;

    FOR v_sets, v_set_number IN
      SELECT elem, ordinality - 1
      FROM jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ordinality)
    LOOP

      INSERT INTO gym_sets (
        session_exercise_id,
        weight,
        reps,
        rpe,
        set_number,
        time_min,
        distance_meters
      )
      VALUES (
        v_session_exercise_id,
        (v_sets->>'weight')::numeric,
        (v_sets->>'reps')::integer,
        (v_sets->>'rpe')::text,
        v_set_number,
        (v_sets->>'time_min')::numeric,
        (v_sets->>'distance_meters')::numeric
      );

    END LOOP;

  END LOOP;

  -- Handle voice recordings
  IF array_length(p_deleted_recording_ids, 1) > 0 THEN
    DELETE FROM sessions_voice WHERE id = ANY(p_deleted_recording_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_recordings) > 0 THEN
    INSERT INTO sessions_voice (storage_path, session_id, duration_ms)
    SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_recordings) AS r;
  END IF;

  -- Handle images
  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM session_images WHERE id = ANY(p_deleted_image_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_images) > 0 THEN
    INSERT INTO session_images (storage_path, session_id)
    SELECT r->>'storage_path', p_id
    FROM jsonb_array_elements(p_new_images) AS r;
  END IF;

  -- Handle videos
  IF array_length(p_deleted_video_ids, 1) > 0 THEN
    DELETE FROM session_videos WHERE id = ANY(p_deleted_video_ids) AND session_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_videos) > 0 THEN
    INSERT INTO session_videos (storage_path, thumbnail_storage_path, session_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_videos) AS r;
  END IF;

  -- Recompute total volume
  v_total_volume := (
    SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
    FROM jsonb_array_elements(p_exercises) AS e,
         jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
    WHERE (s->>'weight') IS NOT NULL
      AND (s->>'reps') IS NOT NULL
  );

  UPDATE session_stats
  SET total_volume = v_total_volume
  WHERE session_id = v_session_id;

  SELECT count(*) INTO v_image_count FROM session_images WHERE session_id = p_id;
  SELECT count(*) INTO v_video_count FROM session_videos WHERE session_id = p_id;
  SELECT count(*) INTO v_voice_count FROM sessions_voice WHERE session_id = p_id;

  UPDATE feed_items
  SET
    title = p_title,
    extra_fields = jsonb_build_object(
      'duration', p_duration,
      'exercises_count', jsonb_array_length(p_exercises),
      'sets_count', (
        SELECT coalesce(sum(jsonb_array_length(e->'sets')), 0)
        FROM jsonb_array_elements(p_exercises) AS t(e)
      ),
      'image-count', v_image_count,
      'video-count', v_video_count,
      'voice-count', v_voice_count
    )
  WHERE source_id = p_id AND type = 'gym_sessions'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;

-- ============================================================
-- 5. Update activities_save_activity — add image/video parameters
-- ============================================================

DROP FUNCTION IF EXISTS public.activities_save_activity(text, text, integer, timestamptz, timestamptz, jsonb, uuid, integer, jsonb);

CREATE FUNCTION "public"."activities_save_activity"(
  "p_title" text,
  "p_notes" text,
  "p_duration" integer,
  "p_start_time" timestamp with time zone,
  "p_end_time" timestamp with time zone,
  "p_track" jsonb,
  "p_activity_id" uuid,
  "p_steps" integer,
  "p_draftrecordings" jsonb DEFAULT '[]'::jsonb,
  "p_images" jsonb DEFAULT '[]'::jsonb,
  "p_videos" jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
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

  INSERT INTO sessions (
    title,
    notes,
    duration,
    start_time,
    end_time,
    activity_id
  )
  VALUES (
    p_title,
    p_notes,
    p_duration,
    p_start_time,
    p_end_time,
    p_activity_id
  )
  RETURNING id INTO v_activity_id;

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
        session_id,
        recorded_at,
        latitude,
        longitude,
        accuracy,
        altitude,
        is_stationary,
        bad_signal
      )
      VALUES (
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
          p.longitude,
          p.latitude,
          p.recorded_at,
          p.is_stationary,
          p.bad_signal,
          CASE
            WHEN extract(epoch FROM (p.recorded_at - lag(p.recorded_at) OVER (ORDER BY p.recorded_at))) > 60
                 AND ST_DistanceSphere(
                   ST_MakePoint(p.longitude, p.latitude),
                   ST_MakePoint(
                     lag(p.longitude) OVER (ORDER BY p.recorded_at),
                     lag(p.latitude) OVER (ORDER BY p.recorded_at)
                   )
                 ) > 100
            THEN 1
            ELSE 0
          END AS is_gap
        FROM activity_gps_points p
        WHERE p.session_id = v_activity_id
      ),
      points_with_segments AS (
        SELECT
          longitude,
          latitude,
          recorded_at,
          is_stationary,
          bad_signal,
          sum(is_gap) OVER (ORDER BY recorded_at) AS segment_id
        FROM points_with_gaps
      ),
      segment_lines AS (
        SELECT
          segment_id,
          ST_MakeLine(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            ORDER BY recorded_at
          ) AS line
        FROM points_with_segments
        WHERE NOT is_stationary AND NOT bad_signal
        GROUP BY segment_id
        HAVING count(*) >= 2
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
    SELECT distance_meters INTO v_distance
    FROM session_stats
    WHERE session_id = v_activity_id;
  END IF;

  SELECT name, slug
  INTO v_activity_name, v_activity_slug
  FROM activities
  WHERE id = p_activity_id;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'activity_sessions',
    jsonb_build_object(
      'duration', p_duration,
      'start_time', p_start_time,
      'end_time', p_end_time,
      'distance', v_distance,
      'activity_name', v_activity_name,
      'activity_slug', v_activity_slug,
      'voice_count', jsonb_array_length(p_draftRecordings),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos)
    ),
    v_activity_id,
    p_start_time
  );

  RETURN v_activity_id;
END;
$$;
