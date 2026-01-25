create or replace function notes_save_note(
  p_title text,
  p_notes text,
  p_draftRecordings jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_note_id uuid;
begin

-- insert note 

insert into notes (
  title, 
  notes
)
values (
  p_title,
  p_notes
)
returning id into v_note_id;

insert into notes_voice (
  storage_path,
  note_id,
  duration_ms
)
select
  r->>'storage_path',
  v_note_id,
  (r->>'duration_ms')::integer
from jsonb_array_elements(p_draftRecordings) as r;

-- insert into feed item_id

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'notes',
  jsonb_build_object('notes', p_notes, 'voice-count', jsonb_array_length(p_draftRecordings)),
  v_note_id,
  now()
);

return v_note_id;
end;
$$