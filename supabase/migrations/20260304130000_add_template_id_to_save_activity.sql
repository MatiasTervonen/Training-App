-- Add p_template_id parameter to activities_save_activity RPC
-- so sessions started from a template get linked back to it.

DROP FUNCTION IF EXISTS public.activities_save_activity(text, text, integer, timestamptz, timestamptz, jsonb, uuid, integer, jsonb, jsonb, jsonb);

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
  "p_videos" jsonb DEFAULT '[]'::jsonb,
  "p_template_id" uuid DEFAULT NULL
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
    activity_id,
    template_id
  )
  VALUES (
    p_title,
    p_notes,
    p_duration,
    p_start_time,
    p_end_time,
    p_activity_id,
    p_template_id
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
