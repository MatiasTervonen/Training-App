-- ============================================================
-- Add height_cm to users table and update compute stats RPC
-- to accept step-based distance for non-GPS sessions.
-- ============================================================

-- 1. Add height_cm column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm NUMERIC;

-- 2. Update activities_compute_session_stats to accept step-based distance
DROP FUNCTION IF EXISTS activities_compute_session_stats(uuid, integer);

CREATE FUNCTION activities_compute_session_stats(
  p_session_id uuid,
  p_steps integer,
  p_step_distance_meters numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_distance numeric := 0;
  v_moving_time_seconds numeric := 0;
  v_duration_seconds numeric;
  v_base_met numeric;
  v_user_weight_kg numeric;
  v_calories numeric;
BEGIN
  WITH ordered_points AS (
    SELECT
      recorded_at,
      latitude,
      longitude,
      lag(latitude) OVER w AS prev_latitude,
      lag(longitude) OVER w AS prev_longitude,
      lag(recorded_at) OVER w AS prev_time,
      is_stationary
    FROM activity_gps_points
    WHERE session_id = p_session_id
    WINDOW w AS (ORDER BY recorded_at)
  ),
  deltas AS (
    SELECT
      extract(epoch FROM (recorded_at - prev_time)) AS delta_time,
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians(latitude - prev_latitude) / 2), 2) +
          cos(radians(latitude)) * cos(radians(prev_latitude)) *
          power(sin(radians(longitude - prev_longitude) / 2), 2)
        )
      ) AS delta_distance,
      is_stationary
    FROM ordered_points
    WHERE prev_time IS NOT NULL
  ),
  moving_segments AS (
    SELECT delta_time, delta_distance
    FROM deltas
    WHERE delta_time > 0
    AND is_stationary = false
  )
  SELECT
    coalesce(sum(delta_distance), 0),
    coalesce(sum(delta_time), 0)
  INTO
    v_distance,
    v_moving_time_seconds
  FROM moving_segments;

  -- Use step-based distance when no GPS distance was calculated
  IF v_distance = 0 AND p_step_distance_meters IS NOT NULL AND p_step_distance_meters > 0 THEN
    v_distance := p_step_distance_meters;
  END IF;

  -- Calculate calories
  SELECT
    s.duration,
    a.base_met,
    coalesce(
      (SELECT weight
       FROM weight
       WHERE user_id = s.user_id
       ORDER BY created_at DESC
       LIMIT 1), 70
    )
  INTO
    v_duration_seconds,
    v_base_met,
    v_user_weight_kg
  FROM sessions s
  JOIN activities a ON s.activity_id = a.id
  WHERE s.id = p_session_id;

  IF v_moving_time_seconds > 0 THEN
    v_calories := v_base_met * v_user_weight_kg * (v_moving_time_seconds / 3600);
  ELSE
    v_calories := v_base_met * v_user_weight_kg * (v_duration_seconds / 3600);
  END IF;

  INSERT INTO session_stats (
    session_id,
    distance_meters,
    moving_time_seconds,
    avg_pace,
    avg_speed,
    steps,
    calories,
    computed_at
  )
  VALUES (
    p_session_id,
    v_distance,
    v_moving_time_seconds,
    CASE
      WHEN v_distance > 0
      THEN v_moving_time_seconds / (v_distance / 1000)
      ELSE NULL
    END,
    CASE
      WHEN v_moving_time_seconds > 0
      THEN (v_distance / 1000) / (v_moving_time_seconds / 3600)
      ELSE NULL
    END,
    p_steps,
    v_calories,
    now()
  )
  ON CONFLICT (session_id) DO UPDATE
  SET
    distance_meters = excluded.distance_meters,
    moving_time_seconds = excluded.moving_time_seconds,
    avg_pace = excluded.avg_pace,
    avg_speed = excluded.avg_speed,
    steps = excluded.steps,
    calories = excluded.calories,
    computed_at = excluded.computed_at;
END;
$$;

-- 3. Update activities_save_activity to accept step-based distance
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
  p_template_id uuid DEFAULT NULL,
  p_step_distance_meters numeric DEFAULT NULL
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

  PERFORM activities_compute_session_stats(v_activity_id, p_steps, p_step_distance_meters);

  IF p_track IS NOT NULL THEN
    SELECT distance_meters INTO v_distance FROM session_stats WHERE session_id = v_activity_id;
  ELSE
    -- For non-GPS sessions, use step distance for feed item
    v_distance := p_step_distance_meters;
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
