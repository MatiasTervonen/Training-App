create or replace function todo_save_todo(
  p_title text,
  p_todo_list jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_todo_id uuid;
begin

-- insert todo list 

insert into todo_lists (
  title
)
values (
  p_title
)
returning id into v_todo_id;


insert into todo_tasks (
  list_id,
  task,
  notes,
  position
)
select
  v_todo_id,
  elem->>'task'  as task,
  elem->>'notes' as notes,
  ordinality - 1 as position
from jsonb_array_elements(p_todo_list) with ordinality as t(elem, ordinality);


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
  'todo_lists',
  jsonb_build_object('completed', 0, 'total', jsonb_array_length(p_todo_list)),
  v_todo_id,
  now()
);

return v_todo_id;
end;
$$