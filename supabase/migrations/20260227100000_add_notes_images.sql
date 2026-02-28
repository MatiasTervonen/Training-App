-- Add image support to notes (mirrors notes_voice pattern)

-- ============================================================
-- 1. Create notes_images table
-- ============================================================

CREATE TABLE notes_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note images"
  ON notes_images FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note images"
  ON notes_images FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note images"
  ON notes_images FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. Update notes_save_note — add p_images parameter
-- ============================================================

DROP FUNCTION IF EXISTS notes_save_note(text, text, jsonb, uuid);

CREATE FUNCTION notes_save_note(
  p_title text,
  p_notes text,
  p_draftrecordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL,
  p_images jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_note_id uuid;
BEGIN
  INSERT INTO notes (title, notes, folder_id)
  VALUES (p_title, p_notes, p_folder_id)
  RETURNING id INTO v_note_id;

  -- Insert voice recordings if any were provided
  INSERT INTO notes_voice (storage_path, note_id, duration_ms)
  SELECT
    r->>'storage_path',
    v_note_id,
    (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_draftrecordings) AS r;

  -- Insert images if any were provided
  INSERT INTO notes_images (storage_path, note_id)
  SELECT
    r->>'storage_path',
    v_note_id
  FROM jsonb_array_elements(p_images) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'notes',
    jsonb_build_object(
      'notes', p_notes,
      'voice-count', jsonb_array_length(p_draftrecordings),
      'image-count', jsonb_array_length(p_images),
      'folder_id', p_folder_id
    ),
    v_note_id,
    now()
  );

  RETURN v_note_id;
END;
$$;

-- ============================================================
-- 3. Update notes_edit_note — add image parameters
-- ============================================================

DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb, uuid);

CREATE FUNCTION notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] DEFAULT '{}',
  p_new_recordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL,
  p_deleted_image_ids uuid[] DEFAULT '{}',
  p_new_images jsonb DEFAULT '[]'::jsonb
)
RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_feed_item feed_items;
  v_voice_count integer;
  v_image_count integer;
BEGIN
  UPDATE notes
  SET title = p_title, notes = p_notes, folder_id = p_folder_id, updated_at = p_updated_at
  WHERE id = p_id;

  -- Handle voice recordings
  IF array_length(p_deleted_recording_ids, 1) > 0 THEN
    DELETE FROM notes_voice WHERE id = ANY(p_deleted_recording_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_recordings) > 0 THEN
    INSERT INTO notes_voice (storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_recordings) AS r;
  END IF;

  -- Handle images
  IF array_length(p_deleted_image_ids, 1) > 0 THEN
    DELETE FROM notes_images WHERE id = ANY(p_deleted_image_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_images) > 0 THEN
    INSERT INTO notes_images (storage_path, note_id)
    SELECT r->>'storage_path', p_id
    FROM jsonb_array_elements(p_new_images) AS r;
  END IF;

  SELECT count(*) INTO v_voice_count FROM notes_voice WHERE note_id = p_id;
  SELECT count(*) INTO v_image_count FROM notes_images WHERE note_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object(
        'notes', p_notes,
        'voice-count', v_voice_count,
        'image-count', v_image_count,
        'folder_id', p_folder_id
      ),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'notes'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;
