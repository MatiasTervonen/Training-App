-- Drop old function overloads that were not replaced by the folders migration.
-- The folders migration added p_folder_id parameter, creating new overloads
-- instead of replacing the originals.

-- Old notes_save_note(text, text, jsonb) — replaced by (text, text, jsonb, uuid)
DROP FUNCTION IF EXISTS notes_save_note(text, text, jsonb);

-- Old notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb) — replaced by (uuid, text, text, timestamptz, uuid[], jsonb, uuid)
DROP FUNCTION IF EXISTS notes_edit_note(uuid, text, text, timestamptz, uuid[], jsonb);

-- Fix notes_move_to_folder: clean up folder-scoped pins when moving
DROP FUNCTION IF EXISTS notes_move_to_folder(uuid, uuid);
CREATE FUNCTION notes_move_to_folder(
  p_note_id   uuid,
  p_folder_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM pinned_items
  WHERE feed_item_id = (
    SELECT id FROM feed_items
    WHERE source_id = p_note_id AND type = 'notes' AND user_id = auth.uid()
  )
  AND (pinned_context LIKE 'notes:folder:%' OR pinned_context = 'notes:unfiled');

  UPDATE notes
  SET folder_id = p_folder_id
  WHERE id = p_note_id
    AND user_id = auth.uid();

  UPDATE feed_items
  SET extra_fields = extra_fields || jsonb_build_object('folder_id', p_folder_id)
  WHERE source_id = p_note_id
    AND type = 'notes'
    AND user_id = auth.uid();
END;
$$;
