-- Fix: merge duplicate function overloads into single unified functions.
-- PostgREST cannot disambiguate between overloads when optional params have defaults.

-- ============================================================
-- 1. Fix notes_save_note — merge web + mobile into one function
-- ============================================================

-- Drop ALL existing overloads
DROP FUNCTION IF EXISTS notes_save_note(text, text);
DROP FUNCTION IF EXISTS notes_save_note(text, text, uuid);
DROP FUNCTION IF EXISTS notes_save_note(text, text, jsonb);
DROP FUNCTION IF EXISTS notes_save_note(text, text, jsonb, uuid);

CREATE FUNCTION notes_save_note(
  p_title text,
  p_notes text,
  p_draftrecordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL
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

  -- Insert voice recordings if any were provided (mobile)
  INSERT INTO notes_voice (storage_path, note_id, duration_ms)
  SELECT
    r->>'storage_path',
    v_note_id,
    (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_draftrecordings) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'notes',
    jsonb_build_object(
      'notes', p_notes,
      'voice-count', jsonb_array_length(p_draftrecordings),
      'folder_id', p_folder_id
    ),
    v_note_id,
    now()
  );

  RETURN v_note_id;
END;
$$;

-- ============================================================
-- 2. Fix notes_edit_note — merge web + mobile into one function
-- ============================================================

-- Drop ALL existing overloads
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid);
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb);
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb, uuid);

CREATE FUNCTION notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] DEFAULT '{}',
  p_new_recordings jsonb DEFAULT '[]'::jsonb,
  p_folder_id uuid DEFAULT NULL
)
RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_feed_item feed_items;
  v_voice_count integer;
BEGIN
  UPDATE notes
  SET title = p_title, notes = p_notes, folder_id = p_folder_id, updated_at = p_updated_at
  WHERE id = p_id;

  IF array_length(p_deleted_recording_ids, 1) > 0 THEN
    DELETE FROM notes_voice WHERE id = ANY(p_deleted_recording_ids) AND note_id = p_id;
  END IF;

  IF jsonb_array_length(p_new_recordings) > 0 THEN
    INSERT INTO notes_voice (storage_path, note_id, duration_ms)
    SELECT r->>'storage_path', p_id, (r->>'duration_ms')::integer
    FROM jsonb_array_elements(p_new_recordings) AS r;
  END IF;

  SELECT count(*) INTO v_voice_count FROM notes_voice WHERE note_id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object('notes', p_notes, 'voice-count', v_voice_count, 'folder_id', p_folder_id),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'notes'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;
