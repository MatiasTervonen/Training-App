create or replace function notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_note_id uuid;
begin

-- update note 

update notes 
set 
  title = p_title,
  notes = p_notes,
  updated_at = p_updated_at
where id = p_id
returning id into v_note_id;

if not found then
  raise exception 'Note not found';
end if;

-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'notes';

return v_note_id;
end;
$$