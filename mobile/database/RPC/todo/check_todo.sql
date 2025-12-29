create or replace function todo_check_todo(
  p_list_id uuid,
  p_todo_tasks jsonb,
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

-- update todo list

update todo_lists 
set 
  updated_at = p_updated_at
where id = p_list_id;

-- update todo tasks

update todo_tasks t 
set 
is_completed = src.is_completed,
position = src.position,
updated_at = case 
    when t.is_completed is distinct from src.is_completed
    then p_updated_at
    else t.updated_at
  end
from (
    select 
    (elem->>'id')::uuid as id,
    (elem->>'is_completed')::boolean as is_completed,
    (elem->>'position')::integer as position
    from jsonb_array_elements(p_todo_tasks) as elem
) src 
where t.id = src.id 
  and t.list_id = p_list_id;


-- update feed item

update feed_items 
set
  extra_fields = jsonb_build_object('completed', (select count(*) from todo_tasks where list_id = p_list_id and is_completed = true), 'total', (select count(*) from todo_tasks where list_id = p_list_id)),
  updated_at = p_updated_at
where source_id = p_list_id
 and type = 'todo_lists'
 returning * into v_feed_item;

return v_feed_item;
end;
$$