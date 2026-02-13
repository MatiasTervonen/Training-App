create or replace function reminders_delete_global_reminder(
  p_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin

-- delete reminder 

delete from global_reminders 
 where id = p_id;  

-- delete feed item

delete from feed_items 
 where source_id = p_id 
 and type = 'global_reminders';

end;
$$