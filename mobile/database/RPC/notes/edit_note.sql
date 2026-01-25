create or replace function notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz,
  p_deleted_recording_ids uuid[] default '{}',
  p_new_recordings jsonb default '[]'::jsonb
)
returns feed_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_feed_item feed_items;
  v_voice_count integer;
begin

-- update note

update notes
set
  title = p_title,
  notes = p_notes,
  updated_at = p_updated_at
where id = p_id;

-- delete voice recordings if any
if array_length(p_deleted_recording_ids, 1) > 0 then
  delete from notes_voice
  where id = any(p_deleted_recording_ids)
    and note_id = p_id;
end if;

-- insert new voice recordings if any
if jsonb_array_length(p_new_recordings) > 0 then
  insert into notes_voice (
    storage_path,
    note_id,
    duration_ms
  )
  select
    r->>'storage_path',
    p_id,
    (r->>'duration_ms')::integer
  from jsonb_array_elements(p_new_recordings) as r;
end if;

-- get current voice count
select count(*) into v_voice_count
from notes_voice
where note_id = p_id;

-- update feed item with new voice count
update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'voice-count', v_voice_count),
  updated_at = p_updated_at
where source_id = p_id
  and type = 'notes'
returning * into v_feed_item;

return v_feed_item;
end;
$$