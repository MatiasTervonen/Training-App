-- ============================================================
-- Attach media to an existing note
-- ============================================================

DROP FUNCTION IF EXISTS attach_note_media(uuid, jsonb, jsonb, jsonb);

CREATE FUNCTION attach_note_media(
  p_note_id uuid,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_current_images integer;
  v_current_videos integer;
  v_current_voice integer;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_owner_id FROM notes WHERE id = p_note_id;
  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Note not found or unauthorized';
  END IF;

  -- Get current counts for limit validation
  SELECT count(*) INTO v_current_images FROM notes_images WHERE note_id = p_note_id;
  SELECT count(*) INTO v_current_videos FROM notes_videos WHERE note_id = p_note_id;
  SELECT count(*) INTO v_current_voice FROM notes_voice WHERE note_id = p_note_id;

  -- Validate limits
  IF v_current_images + jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF v_current_videos + jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF v_current_voice + jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  -- Insert recordings
  IF jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 0 THEN
    INSERT INTO notes_voice (storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', p_note_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_recordings) AS r;
  END IF;

  -- Insert images
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 0 THEN
    INSERT INTO notes_images (storage_path, note_id)
    SELECT r->>'storage_path', p_note_id
    FROM jsonb_array_elements(p_images) AS r;
  END IF;

  -- Insert videos
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 0 THEN
    INSERT INTO notes_videos (storage_path, thumbnail_storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_note_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_videos) AS r;
  END IF;

  -- Recount and update feed_items
  SELECT count(*) INTO v_current_images FROM notes_images WHERE note_id = p_note_id;
  SELECT count(*) INTO v_current_videos FROM notes_videos WHERE note_id = p_note_id;
  SELECT count(*) INTO v_current_voice FROM notes_voice WHERE note_id = p_note_id;

  UPDATE feed_items
  SET extra_fields = extra_fields
    || jsonb_build_object(
      'image-count', v_current_images,
      'video-count', v_current_videos,
      'voice-count', v_current_voice
    )
  WHERE source_id = p_note_id AND type = 'notes';
END;
$$;

-- ============================================================
-- Attach media to an existing weight entry
-- ============================================================

DROP FUNCTION IF EXISTS attach_weight_media(uuid, jsonb, jsonb, jsonb);

CREATE FUNCTION attach_weight_media(
  p_weight_id uuid,
  p_images jsonb DEFAULT '[]'::jsonb,
  p_videos jsonb DEFAULT '[]'::jsonb,
  p_recordings jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_current_images integer;
  v_current_videos integer;
  v_current_voice integer;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_owner_id FROM weight WHERE id = p_weight_id;
  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Weight entry not found or unauthorized';
  END IF;

  -- Get current counts for limit validation
  SELECT count(*) INTO v_current_images FROM weight_images WHERE weight_id = p_weight_id;
  SELECT count(*) INTO v_current_videos FROM weight_videos WHERE weight_id = p_weight_id;
  SELECT count(*) INTO v_current_voice FROM weight_voice WHERE weight_id = p_weight_id;

  -- Validate limits
  IF v_current_images + jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 images per entry';
  END IF;
  IF v_current_videos + jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 3 THEN
    RAISE EXCEPTION 'Maximum 3 videos per entry';
  END IF;
  IF v_current_voice + jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 voice recordings per entry';
  END IF;

  -- Insert recordings
  IF jsonb_array_length(COALESCE(p_recordings, '[]'::jsonb)) > 0 THEN
    INSERT INTO weight_voice (storage_path, weight_id, duration_ms)
    SELECT r->>'storage_path', p_weight_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_recordings) AS r;
  END IF;

  -- Insert images
  IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 0 THEN
    INSERT INTO weight_images (storage_path, weight_id)
    SELECT r->>'storage_path', p_weight_id
    FROM jsonb_array_elements(p_images) AS r;
  END IF;

  -- Insert videos
  IF jsonb_array_length(COALESCE(p_videos, '[]'::jsonb)) > 0 THEN
    INSERT INTO weight_videos (storage_path, thumbnail_storage_path, weight_id, duration_ms)
    SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_weight_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_videos) AS r;
  END IF;

  -- Recount and update feed_items
  SELECT count(*) INTO v_current_images FROM weight_images WHERE weight_id = p_weight_id;
  SELECT count(*) INTO v_current_videos FROM weight_videos WHERE weight_id = p_weight_id;
  SELECT count(*) INTO v_current_voice FROM weight_voice WHERE weight_id = p_weight_id;

  UPDATE feed_items
  SET extra_fields = extra_fields
    || jsonb_build_object(
      'image-count', v_current_images,
      'video-count', v_current_videos,
      'voice-count', v_current_voice
    )
  WHERE source_id = p_weight_id AND type = 'weight';
END;
$$;
