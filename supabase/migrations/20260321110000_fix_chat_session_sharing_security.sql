-- Fix: change session sharing RPCs from SECURITY INVOKER to SECURITY DEFINER
-- so friends can read session data through RLS-protected tables.
-- Authorization is enforced inside the functions (conversation membership + session_share message check).

-- 1. Fix get_friend_gym_session_by_chat
DROP FUNCTION IF EXISTS get_friend_gym_session_by_chat(uuid, uuid, text);
CREATE FUNCTION get_friend_gym_session_by_chat(
  p_session_id uuid,
  p_conversation_id uuid,
  p_language text DEFAULT 'en'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'session_share'
      AND deleted_at IS NULL
      AND content::jsonb->>'source_id' = p_session_id::text
  ) THEN
    RAISE EXCEPTION 'Session not shared in this conversation';
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
            'name', COALESCE(get.name, ge.name),
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
      LEFT JOIN gym_exercises_translations get ON get.exercise_id = ge.id AND get.language = p_language
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
  WHERE s.id = p_session_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN v_result;
END;
$$;

-- 2. Fix get_friend_activity_session_by_chat
DROP FUNCTION IF EXISTS get_friend_activity_session_by_chat(uuid, uuid);
CREATE FUNCTION get_friend_activity_session_by_chat(
  p_session_id uuid,
  p_conversation_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND message_type = 'session_share'
      AND deleted_at IS NULL
      AND content::jsonb->>'source_id' = p_session_id::text
  ) THEN
    RAISE EXCEPTION 'Session not shared in this conversation';
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
    ),
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
  WHERE s.id = p_session_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN v_result;
END;
$$;
