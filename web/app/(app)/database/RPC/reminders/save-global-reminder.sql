create or replace function reminders_save_global_reminder(
  p_title text,
  p_notes text,
  p_notify_at timestamptz,
  p_type text,
  p_created_from_token text default null,
  p_mode text default 'normal'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_reminder_id uuid;
begin

-- insert reminder

insert into global_reminders (
  title,
  notes,
  notify_at,
  type,
  created_from_token,
  mode
)
values (
  p_title,
  p_notes,
  p_notify_at,
  p_type,
  p_created_from_token,
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
  'global_reminders',
  jsonb_build_object('notes', p_notes, 'notify_at', p_notify_at, 'type', 'global', 'mode', p_mode),
  v_reminder_id,
  now()
);

return v_reminder_id;
end;
$$