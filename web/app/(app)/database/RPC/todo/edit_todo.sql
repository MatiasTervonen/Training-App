create or replace function todo_edit_todo(
  p_id uuid,
  p_title text,
  p_tasks jsonb,
  p_deleted_ids uuid[],
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
  title = p_title,
  updated_at = p_updated_at
where id = p_id;

-- update todo tasks

update todo_tasks t 
set 
task = src.task,
notes = src.notes,
position = src.position,
updated_at = case 
    when t.task is distinct from src.task 
      or t.notes is distinct from src.notes
    then p_updated_at
    else t.updated_at
  end
from (
    select 
    (elem->>'id')::uuid as id,
    (elem->>'task')::text as task,
    (elem->>'notes')::text as notes,
    (elem->>'position')::integer as position
    from jsonb_array_elements(p_tasks) as elem
) src 
where t.id = src.id 
  and t.list_id = p_id;


 -- insert new todo tasks

insert into todo_tasks (
    list_id,
    task,
    notes,
    position
)
select
    p_id,
    elem->>'task',
    elem->>'notes',
    (elem->>'position')::integer
from jsonb_array_elements(p_tasks) elem
 where elem->>'id' is null;

 -- delete todo tasks

 delete from todo_tasks
 where list_id = p_id
 and id = any(p_deleted_ids);


-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('completed', (select count(*) from todo_tasks where list_id = p_id and is_completed = true), 'total', (select count(*) from todo_tasks where list_id = p_id)),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'todo_lists'
 returning * into v_feed_item;

return v_feed_item;
end;
$$