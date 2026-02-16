-- ============================================================
-- Migration: Add note_folders feature
-- ============================================================

-- 1. Create note_folders table
CREATE TABLE note_folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid()
                         REFERENCES users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX idx_note_folders_user_id ON note_folders(user_id);
CREATE UNIQUE INDEX idx_note_folders_user_name ON note_folders(user_id, name);

-- 2. RLS policies for note_folders
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON note_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON note_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON note_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON note_folders FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Add folder_id column to notes table
ALTER TABLE notes
  ADD COLUMN folder_id uuid
  REFERENCES note_folders(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_folder_id ON notes(folder_id);

-- 4. Create notes_get_by_folder RPC
CREATE OR REPLACE FUNCTION notes_get_by_folder(
  p_folder_id    uuid    DEFAULT NULL,
  p_unfiled_only boolean DEFAULT false,
  p_limit        integer DEFAULT 10,
  p_offset       integer DEFAULT 0
)
RETURNS SETOF feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_unfiled_only THEN
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    JOIN notes n ON fi.source_id::uuid = n.id
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
      AND n.folder_id IS NULL
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF p_folder_id IS NOT NULL THEN
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    JOIN notes n ON fi.source_id::uuid = n.id
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
      AND n.folder_id = p_folder_id
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSE
    RETURN QUERY
    SELECT fi.*
    FROM feed_items fi
    WHERE fi.type = 'notes'
      AND fi.user_id = auth.uid()
    ORDER BY fi.activity_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;

-- 5. Create notes_move_to_folder RPC
CREATE OR REPLACE FUNCTION notes_move_to_folder(
  p_note_id   uuid,
  p_folder_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE notes
  SET folder_id = p_folder_id,
      updated_at = now()
  WHERE id = p_note_id
    AND user_id = auth.uid();

  UPDATE feed_items
  SET extra_fields = extra_fields || jsonb_build_object('folder_id', p_folder_id),
      updated_at   = now()
  WHERE source_id = p_note_id
    AND type = 'notes'
    AND user_id = auth.uid();
END;
$$;

-- 6. Update notes_save_note RPC (web — no voice recordings)
CREATE OR REPLACE FUNCTION notes_save_note(
  p_title text,
  p_notes text,
  p_folder_id uuid default null
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

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'notes',
    jsonb_build_object('notes', p_notes, 'folder_id', p_folder_id),
    v_note_id,
    now()
  );

  RETURN v_note_id;
END;
$$;

-- 7. Update notes_save_note RPC (mobile — with voice recordings)
CREATE OR REPLACE FUNCTION notes_save_note(
  p_title text,
  p_notes text,
  p_draftRecordings jsonb default '[]'::jsonb,
  p_folder_id uuid default null
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

  INSERT INTO notes_voice (storage_path, note_id, duration_ms)
  SELECT
    r->>'storage_path',
    v_note_id,
    (r->>'duration_ms')::integer
  FROM jsonb_array_elements(p_draftRecordings) AS r;

  INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
  VALUES (
    p_title,
    'notes',
    jsonb_build_object('notes', p_notes, 'voice-count', jsonb_array_length(p_draftRecordings), 'folder_id', p_folder_id),
    v_note_id,
    now()
  );

  RETURN v_note_id;
END;
$$;

-- 8. Update notes_edit_note RPC (web — no voice recordings)
CREATE OR REPLACE FUNCTION notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_folder_id uuid default null
)
RETURNS feed_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_feed_item feed_items;
BEGIN
  UPDATE notes
  SET title = p_title, notes = p_notes, folder_id = p_folder_id, updated_at = p_updated_at
  WHERE id = p_id;

  UPDATE feed_items
  SET title = p_title,
      extra_fields = jsonb_build_object('notes', p_notes, 'folder_id', p_folder_id),
      updated_at = p_updated_at
  WHERE source_id = p_id AND type = 'notes'
  RETURNING * INTO v_feed_item;

  RETURN v_feed_item;
END;
$$;

-- 9. Update notes_edit_note RPC (mobile — with voice recordings)
CREATE OR REPLACE FUNCTION notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] default '{}',
  p_new_recordings jsonb default '[]'::jsonb,
  p_folder_id uuid default null
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
