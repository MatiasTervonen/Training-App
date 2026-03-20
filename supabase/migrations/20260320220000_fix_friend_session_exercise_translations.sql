-- Fix: get_friend_gym_session returns untranslated exercise names.
-- The RPC reads ge.name (English base name) instead of looking up
-- gym_exercises_translations for the viewer's language.
-- Add p_language parameter and COALESCE with translated name.

DROP FUNCTION IF EXISTS get_friend_gym_session(uuid);
DROP FUNCTION IF EXISTS get_friend_gym_session(uuid, text);
CREATE FUNCTION get_friend_gym_session(p_feed_item_id uuid, p_language text DEFAULT 'en')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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

  IF v_feed_item.user_id != auth.uid() AND NOT EXISTS (
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
  WHERE s.id = v_feed_item.source_id;

  RETURN v_result;
END;
$$;
