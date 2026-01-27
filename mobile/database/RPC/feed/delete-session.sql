create or replace function feed_delete_session(
    p_id uuid,
    p_type text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin

if p_type not in (
    'notes',
    'weight',
    'gym_sessions',
    'todo_lists',
    'global_reminders',
    'local_reminders',
    'activity_sessions'
) then 
 raise exception 'invalid feed type: %', p_type;
 end if;

delete from pinned_items 
 where feed_item_id in (
    select id 
    from feed_items
    where source_id = p_id
    and type = p_type
 );

 delete from feed_items 
 where source_id = p_id
 and type = p_type;

 -- Delete domain row
if p_type in ('gym_sessions', 'activity_sessions') then
  delete from sessions
  where id = p_id;

else
   -- 4. Delete domain row (dynamic table)
  execute format(
    'delete from %I where id = $1',
    p_type
  )
  using p_id;
end if;


end;
$$;