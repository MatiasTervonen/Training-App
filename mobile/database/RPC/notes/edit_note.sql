create or replace function notes_edit_note(
  p_id uuid,
  p_title text,
  p_notes text,
  p_updated_at timestamptz
)
returns feed_items
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_feed_item feed_items;
begin

-- update note 

update notes 
set 
  title = p_title,
  notes = p_notes,
  updated_at = p_updated_at
where id = p_id;

-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'notes'
 returning * into v_feed_item; 

return v_feed_item;
end;
$$