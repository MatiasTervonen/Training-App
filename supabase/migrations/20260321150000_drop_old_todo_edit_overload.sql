-- Drop the old todo_edit_todo overload from the remote schema.
-- It has a different parameter order (p_deleted_ids before p_updated_at)
-- and was never dropped by later migrations that created the new signature.
-- PostgREST may resolve to the old function, which doesn't use temp_id
-- for new task inserts — causing id mismatches and lost notes on update.

DROP FUNCTION IF EXISTS todo_edit_todo(uuid, text, jsonb, uuid[], timestamptz);
