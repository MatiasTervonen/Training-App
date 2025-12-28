create or replace function reminders_edit_global_reminder(
  p_id uuid,
  p_title text,
  p_notes text,
  p_notify_at timestamptz,
  p_seen_at timestamptz,
  p_delivered boolean,
  p_updated_at timestamptz
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

update global_reminders 
set 
  title = p_title,
  notes = p_notes,
  notify_at = p_notify_at,
  seen_at = p_seen_at,
  delivered = p_delivered,
  updated_at = p_updated_at
where id = p_id
returning id into v_reminder_id;

if not found then
  raise exception 'Reminder not found';
end if;

-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'notify_at', p_notify_at, 'seen_at', p_seen_at, 'delivered', p_delivered, 'type', 'global'),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'global_reminders';

return v_reminder_id;
end;
$$