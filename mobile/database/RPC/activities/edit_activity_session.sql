create or replace function activity_edit_activity_session(
  p_id uuid,
  p_title text,
  p_notes text,
  p_activity_id uuid,
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

-- update activity session

update activity_sessions 
set 
  title = p_title,
  notes = p_notes,
  activity_id = p_activity_id,
  updated_at = p_updated_at  
where id = p_id;

-- update feed item

update feed_items
set
  title = p_title,
  extra_fields = extra_fields || jsonb_build_object('notes', p_notes),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'activity_sessions'
 returning * into v_feed_item; 

return v_feed_item;
end;
$$