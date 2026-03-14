-- Update weight_edit_weight to support media CRUD (images, videos, voice recordings)

DROP FUNCTION IF EXISTS weight_edit_weight(uuid, text, text, numeric, timestamptz);

CREATE FUNCTION weight_edit_weight(
  p_id uuid,
  p_title text,
  p_notes text,
  p_weight numeric,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] DEFAULT '{}',
  p_new_recordings jsonb DEFAULT '[]'::jsonb,
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_new_images jsonb DEFAULT '[]'::jsonb,
  p_deleted_video_ids uuid[] DEFAULT '{}',
  p_new_videos jsonb DEFAULT '[]'::jsonb
) RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  v_feed_item feed_items;
  v_voice_count integer;
  v_image_count integer;
  v_video_count integer;
BEGIN
  -- Update weight record
  UPDATE weight
  SET title = p_title,
      notes = p_notes,
      weight = p_weight,
      updated_at = p_updated_at
  WHERE id = p_id;

  -- Delete removed recordings
  IF array_length(p_deleted_recording_ids, 1) IS NOT NULL THEN
    DELETE FROM weight_voice
    WHERE id = ANY(p_deleted_recording_ids)
      AND weight_id = p_id;
  END IF;

  -- Insert new recordings
  INSERT INTO weight_voice (storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_new_recordings) AS r;

  -- Delete removed images
  IF array_length(p_deleted_image_ids, 1) IS NOT NULL THEN
    DELETE FROM weight_images
    WHERE id = ANY(p_deleted_image_ids)
      AND weight_id = p_id;
  END IF;

  -- Insert new images
  INSERT INTO weight_images (storage_path, weight_id)
  SELECT r->>'storage_path', p_id
  FROM jsonb_array_elements(p_new_images) AS r;

  -- Delete removed videos
  IF array_length(p_deleted_video_ids, 1) IS NOT NULL THEN
    DELETE FROM weight_videos
    WHERE id = ANY(p_deleted_video_ids)
      AND weight_id = p_id;
  END IF;

  -- Insert new videos
  INSERT INTO weight_videos (storage_path, thumbnail_storage_path, weight_id, duration_ms)
  SELECT r->>'storage_path', r->>'thumbnail_storage_path', p_id, (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_new_videos) AS r;

  -- Count current media
  SELECT count(*) INTO v_voice_count FROM weight_voice WHERE weight_id = p_id;
  SELECT count(*) INTO v_image_count FROM weight_images WHERE weight_id = p_id;
  SELECT count(*) INTO v_video_count FROM weight_videos WHERE weight_id = p_id;

  -- Update feed_items with new counts
  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'notes', p_notes,
        'weight', p_weight,
        'voice-count', v_voice_count,
        'image-count', v_image_count,
        'video-count', v_video_count
      )
  WHERE source_id = p_id
    AND type = 'weight'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;
