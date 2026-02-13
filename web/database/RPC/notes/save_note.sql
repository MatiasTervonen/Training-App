create or replace function notes_save_note(
  p_title text,
  p_notes text
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
  jsonb_build_object('notes', p_notes),
  v_note_id,
  now()
);

return v_note_id;
end;
$$