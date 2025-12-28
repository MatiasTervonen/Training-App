create or replace function reminders_edit_local_reminder(
  p_id uuid,
  p_title text,
  p_notes text,
  p_notify_at_time time,
  p_notify_date date,
  p_weekdays json,
  p_type text,
  p_updated_at timestamptz,
  p_seen_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_reminder_id uuid;
begin

-- update reminder 

update local_reminders 
set 
  title = p_title,
  notes = p_notes,
  notify_at_time = p_notify_at_time,
  notify_date = p_notify_date,
  weekdays = p_weekdays,
  type = p_type,
  updated_at = p_updated_at,
  seen_at = p_seen_at
where id = p_id
returning id into v_reminder_id;

if not found then
  raise exception 'Reminder not found';
end if;

-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'notify_at_time', p_notify_at_time, 'notify_date', p_notify_date, 'weekdays', p_weekdays, 'type', p_type),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'local_reminders';

return v_reminder_id;
end;
$$