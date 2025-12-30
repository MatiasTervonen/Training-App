create or replace function reminders_delete_local_reminder(
  p_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin

-- delete reminder 

delete from local_reminders 
 where id = p_id;  

-- delete feed item

delete from feed_items 
 where source_id = p_id 
 and type = 'local_reminders';

end;
$$