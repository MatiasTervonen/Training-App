-- Chat Session Sharing: add session_share message type + new RPCs for chat-based authorization

-- ============================================================
-- 1. Update CHECK constraint to allow session_share messages
-- ============================================================

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_content_check
  CHECK (
    deleted_at IS NOT NULL  -- soft-deleted messages bypass validation
    OR (message_type = 'text' AND content IS NOT NULL AND char_length(content) BETWEEN 1 AND 2000)
    OR (message_type IN ('image', 'video', 'voice') AND media_storage_path IS NOT NULL)
    OR (message_type = 'session_share' AND content IS NOT NULL)
  );

-- ============================================================
-- 2. Update send_message to support session_share type
-- ============================================================

DROP FUNCTION IF EXISTS send_message(uuid, text, text, text, text, integer, uuid);
CREATE FUNCTION send_message(
  p_conversation_id uuid,
  p_content text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_media_storage_path text DEFAULT NULL,
  p_media_thumbnail_path text DEFAULT NULL,
  p_media_duration_ms integer DEFAULT NULL,
  p_reply_to_message_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id uuid;
  v_content_json jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot send messages in this conversation';
  END IF;

  IF p_message_type NOT IN ('text', 'image', 'video', 'voice', 'session_share') THEN
    RAISE EXCEPTION 'Invalid message type';
  END IF;

  IF p_message_type = 'text' THEN
    IF p_content IS NULL OR char_length(p_content) < 1 OR char_length(p_content) > 2000 THEN
      RAISE EXCEPTION 'Text message must be between 1 and 2000 characters';
    END IF;
  END IF;

  IF p_message_type IN ('image', 'video', 'voice') THEN
    IF p_media_storage_path IS NULL THEN
      RAISE EXCEPTION 'Media messages must include a storage path';
    END IF;
  END IF;

  IF p_message_type = 'session_share' THEN
    IF p_content IS NULL THEN
      RAISE EXCEPTION 'Session share must include content';
    END IF;
    IF p_media_storage_path IS NOT NULL THEN
      RAISE EXCEPTION 'Session share must not include media';
    END IF;
    -- Validate JSON structure
    BEGIN
      v_content_json := p_content::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Session share content must be valid JSON';
    END;
    IF v_content_json->>'session_type' IS NULL
       OR v_content_json->>'source_id' IS NULL
       OR v_content_json->>'title' IS NULL THEN
      RAISE EXCEPTION 'Session share must include session_type, source_id, and title';
    END IF;
  END IF;

  IF p_reply_to_message_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM chat_messages
      WHERE id = p_reply_to_message_id
        AND conversation_id = p_conversation_id
    ) THEN
      RAISE EXCEPTION 'Reply target not found in this conversation';
    END IF;
  END IF;

  INSERT INTO chat_messages (
    conversation_id, sender_id, content,
    message_type, media_storage_path, media_thumbnail_path, media_duration_ms,
    reply_to_message_id
  )
  VALUES (
    p_conversation_id, auth.uid(), p_content,
    p_message_type, p_media_storage_path, p_media_thumbnail_path, p_media_duration_ms,
    p_reply_to_message_id
  )
  RETURNING id INTO v_message_id;

  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  UPDATE chat_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  RETURN v_message_id;
END;
$$;

-- ============================================================
-- 2. RPC: get_friend_gym_session_by_chat
--    Authorizes via chat conversation membership + session_share message
-- ============================================================

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
  -- Verify caller is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify a session_share message exists for this session in this conversation
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

-- ============================================================
-- 3. RPC: get_friend_activity_session_by_chat
--    Authorizes via chat conversation membership + session_share message
-- ============================================================

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
  -- Verify caller is a participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify a session_share message exists for this session in this conversation
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
