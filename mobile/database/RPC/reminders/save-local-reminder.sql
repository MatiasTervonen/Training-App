create or replace function reminders_save_local_reminder(                   
  p_title text,
  p_notes text,
  p_notify_at_time time,
  p_notify_date timestamptz,
  p_weekdays json,
  p_type text,
  p_mode text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_reminder_id uuid;
 v_count int;
begin

-- insert reminder 

insert into local_reminders (
  title, 
  notes,
  notify_at_time,
  notify_date,
  weekdays,
  type,
  mode
)
values (
  p_title,
  p_notes,
  p_notify_at_time,
  p_notify_date,
  p_weekdays,
  p_type,
  p_mode
)
returning id into v_reminder_id;

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
  'local_reminders',
  jsonb_build_object('notes', p_notes, 'notify_at_time', p_notify_at_time, 'notify_date', p_notify_date, 'weekdays', p_weekdays, 'type', p_type, 'mode', p_mode),
  v_reminder_id,
  now()
);

get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception
      'feed_items insert blocked: type=%, source_id=%',
      'local_reminders',
      v_reminder_id;
  end if;


return v_reminder_id;
end;
$$