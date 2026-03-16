-- ============================================================
-- Social Feed: visibility, sharing defaults, likes, friend RPCs
-- ============================================================

-- ============================================================
-- 1. Add visibility column to feed_items
-- ============================================================
ALTER TABLE feed_items ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'friends'));

-- ============================================================
-- 2. Create sharing_defaults table
-- ============================================================
CREATE TABLE sharing_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  share_with_friends BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, session_type),
  CHECK (session_type IN ('gym_sessions', 'activity_sessions'))
);

ALTER TABLE sharing_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own sharing defaults"
  ON sharing_defaults FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. Create feed_likes table
-- ============================================================
CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);

CREATE INDEX idx_feed_likes_feed_item ON feed_likes(feed_item_id);
CREATE INDEX idx_feed_likes_user ON feed_likes(user_id);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read likes on visible feed items"
  ON feed_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feed_items fi
      WHERE fi.id = feed_item_id
      AND (
        fi.user_id = auth.uid()
        OR (
          fi.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
               OR (user1_id = fi.user_id AND user2_id = auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert own likes"
  ON feed_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON feed_likes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 4. Add friend SELECT policy on feed_items
-- ============================================================
CREATE POLICY "Friends can read shared feed items"
  ON feed_items FOR SELECT
  USING (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = feed_items.user_id)
         OR (user1_id = feed_items.user_id AND user2_id = auth.uid())
    )
  );

-- ============================================================
-- 5. RPC: get_friends_feed
-- ============================================================
DROP FUNCTION IF EXISTS get_friends_feed(integer, integer);
CREATE FUNCTION get_friends_feed(p_limit integer, p_offset integer)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  type TEXT,
  extra_fields JSONB,
  source_id UUID,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  activity_at TIMESTAMPTZ,
  visibility TEXT,
  author_display_name TEXT,
  author_profile_picture TEXT,
  like_count BIGINT,
  user_has_liked BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fi.id,
    fi.user_id,
    fi.title,
    fi.type,
    fi.extra_fields,
    fi.source_id,
    fi.occurred_at,
    fi.created_at,
    fi.updated_at,
    fi.activity_at,
    fi.visibility,
    u.display_name AS author_display_name,
    u.profile_picture AS author_profile_picture,
    COALESCE(lk.cnt, 0) AS like_count,
    EXISTS (
      SELECT 1 FROM feed_likes fl
      WHERE fl.feed_item_id = fi.id AND fl.user_id = auth.uid()
    ) AS user_has_liked
  FROM feed_items fi
  JOIN users u ON u.id = fi.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM feed_likes WHERE feed_item_id = fi.id
  ) lk ON true
  WHERE fi.visibility = 'friends'
    AND fi.user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
         OR (user1_id = fi.user_id AND user2_id = auth.uid())
    )
  ORDER BY fi.activity_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- 6. RPC: toggle_feed_like
-- ============================================================
DROP FUNCTION IF EXISTS toggle_feed_like(uuid);
CREATE FUNCTION toggle_feed_like(p_feed_item_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM feed_likes
    WHERE feed_item_id = p_feed_item_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM feed_likes
    WHERE feed_item_id = p_feed_item_id AND user_id = auth.uid();
    RETURN false;
  ELSE
    INSERT INTO feed_likes (feed_item_id, user_id)
    VALUES (p_feed_item_id, auth.uid());
    RETURN true;
  END IF;
END;
$$;

-- ============================================================
-- 7. Update gym_save_session to accept p_visibility
-- ============================================================
DROP FUNCTION IF EXISTS gym_save_session(jsonb, text, integer, text, timestamptz, timestamptz, jsonb, jsonb, jsonb, jsonb);

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
  p_phases jsonb DEFAULT '[]'::jsonb,
  p_visibility TEXT DEFAULT 'private'
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
      INSERT INTO gym_sets (session_exercise_id, weight, reps, rpe, set_number)
      VALUES (
        v_session_exercise_id, (v_sets->>'weight')::numeric, (v_sets->>'reps')::integer,
        (v_sets->>'rpe')::text, v_set_number
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

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at, visibility)
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
    v_session_id, p_start_time, p_visibility
  );

  RETURN v_session_id;
END;
$$;

-- ============================================================
-- 8. Update activities_save_activity to accept p_visibility
-- ============================================================
DROP FUNCTION IF EXISTS activities_save_activity(text, text, integer, timestamptz, timestamptz, jsonb, uuid, integer, jsonb, jsonb, jsonb, uuid, numeric);

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
  p_step_distance_meters numeric DEFAULT NULL,
  p_visibility TEXT DEFAULT 'private'
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

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at, visibility)
  VALUES (
    p_title, 'activity_sessions',
    jsonb_build_object(
      'duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time,
      'distance', v_distance, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug,
      'voice_count', jsonb_array_length(p_draftRecordings),
      'image-count', jsonb_array_length(p_images),
      'video-count', jsonb_array_length(p_videos)
    ),
    v_activity_id, p_start_time, p_visibility
  );

  RETURN v_activity_id;
END;
$$;

-- ============================================================
-- 9. RPC: get_friend_gym_session
-- ============================================================
DROP FUNCTION IF EXISTS get_friend_gym_session(uuid);
CREATE FUNCTION get_friend_gym_session(p_feed_item_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_feed_item RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_feed_item
  FROM feed_items
  WHERE id = p_feed_item_id
    AND visibility = 'friends'
    AND type = 'gym_sessions';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found or not shared';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friends
    WHERE (user1_id = auth.uid() AND user2_id = v_feed_item.user_id)
       OR (user1_id = v_feed_item.user_id AND user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'notes', s.notes,
    'duration', s.duration,
    'start_time', s.start_time,
    'end_time', s.end_time,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'user_id', s.user_id,
    'session_stats', (
      SELECT jsonb_build_object(
        'total_volume', ss.total_volume,
        'calories', ss.calories
      )
      FROM session_stats ss WHERE ss.session_id = s.id
    ),
    'gym_session_exercises', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', gse.id,
          'position', gse.position,
          'notes', gse.notes,
          'superset_id', gse.superset_id,
          'gym_exercises', jsonb_build_object(
            'id', ge.id,
            'name', ge.name,
            'equipment', ge.equipment,
            'muscle_group', ge.muscle_group,
            'main_group', ge.main_group
          ),
          'gym_sets', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', gs.id,
                'weight', gs.weight,
                'reps', gs.reps,
                'rpe', gs.rpe,
                'set_number', gs.set_number
              ) ORDER BY gs.set_number
            )
            FROM gym_sets gs WHERE gs.session_exercise_id = gse.id
          ), '[]'::jsonb)
        ) ORDER BY gse.position
      )
      FROM gym_session_exercises gse
      JOIN gym_exercises ge ON ge.id = gse.exercise_id
      WHERE gse.session_id = s.id
    ), '[]'::jsonb),
    'gym_session_phases', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', gsp.id,
          'phase_type', gsp.phase_type,
          'activity_id', gsp.activity_id,
          'duration_seconds', gsp.duration_seconds,
          'steps', gsp.steps,
          'distance_meters', gsp.distance_meters,
          'calories', gsp.calories,
          'is_manual', gsp.is_manual,
          'activities', jsonb_build_object(
            'name', a.name,
            'slug', a.slug,
            'base_met', a.base_met,
            'is_step_relevant', a.is_step_relevant,
            'is_calories_relevant', a.is_calories_relevant
          )
        )
      )
      FROM gym_session_phases gsp
      JOIN activities a ON a.id = gsp.activity_id
      WHERE gsp.session_id = s.id
    ), '[]'::jsonb),
    'sessionImages', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', si.id, 'storage_path', si.storage_path))
      FROM session_images si WHERE si.session_id = s.id
    ), '[]'::jsonb),
    'sessionVideos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', sv.id, 'storage_path', sv.storage_path, 'thumbnail_storage_path', sv.thumbnail_storage_path, 'duration_ms', sv.duration_ms))
      FROM session_videos sv WHERE sv.session_id = s.id
    ), '[]'::jsonb),
    'sessionVoiceRecordings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', svr.id, 'storage_path', svr.storage_path, 'duration_ms', svr.duration_ms))
      FROM sessions_voice svr WHERE svr.session_id = s.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM sessions s
  WHERE s.id = v_feed_item.source_id;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 12. RPC: get_friend_activity_session
-- ============================================================
DROP FUNCTION IF EXISTS get_friend_activity_session(uuid);
CREATE FUNCTION get_friend_activity_session(p_feed_item_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_feed_item RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_feed_item
  FROM feed_items
  WHERE id = p_feed_item_id
    AND visibility = 'friends'
    AND type = 'activity_sessions';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found or not shared';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friends
    WHERE (user1_id = auth.uid() AND user2_id = v_feed_item.user_id)
       OR (user1_id = v_feed_item.user_id AND user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'session', jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'notes', s.notes,
      'duration', s.duration,
      'start_time', s.start_time,
      'end_time', s.end_time,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'user_id', s.user_id,
      'activity_id', s.activity_id,
      'template_id', s.template_id
    ),
    'activity', (
      SELECT jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug,
        'base_met', a.base_met,
        'is_gps_relevant', a.is_gps_relevant,
        'is_step_relevant', a.is_step_relevant,
        'is_calories_relevant', a.is_calories_relevant
      )
      FROM activities a WHERE a.id = s.activity_id
    ),
    'stats', (
      SELECT jsonb_build_object(
        'distance_meters', ss.distance_meters,
        'moving_time_seconds', ss.moving_time_seconds,
        'avg_pace', ss.avg_pace,
        'avg_speed', ss.avg_speed,
        'steps', ss.steps,
        'calories', ss.calories
      )
      FROM session_stats ss WHERE ss.session_id = s.id
    ),
    'route', (
      SELECT ST_AsGeoJSON(s.geom)::jsonb
    )
  ) INTO v_result
  FROM sessions s
  WHERE s.id = v_feed_item.source_id;

  RETURN v_result;
END;
$$;
