-- Update notes_move_to_folder to clean up folder-scoped pins when moving notes.
-- When a note is moved between folders, any folder-scoped pins become orphaned
-- (they'd show in the old folder's carousel). This DELETE removes them so the
-- user can re-pin in the new location.

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
  -- Remove any folder-scoped pins for this note
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
