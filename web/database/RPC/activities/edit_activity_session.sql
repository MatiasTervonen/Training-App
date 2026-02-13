create or replace function activity_edit_session(
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
 v_activity_name text;
 v_activity_slug text;
begin

-- update activity session

update sessions
set
  title = p_title,
  notes = p_notes,
  activity_id = p_activity_id,
  updated_at = p_updated_at
where id = p_id;

select name, slug
into v_activity_name, v_activity_slug
from activities
where id = p_activity_id;

-- update feed item

update feed_items
set
  title = p_title,
  extra_fields = extra_fields || jsonb_build_object('notes', p_notes, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug)
where source_id = p_id
 and type = 'activity_sessions'
 returning * into v_feed_item; 

return v_feed_item;
end;
$$