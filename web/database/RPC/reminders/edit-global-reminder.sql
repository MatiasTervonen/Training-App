create or replace function reminders_edit_global_reminder(
  p_id uuid,
  p_title text,
  p_notes text,
  p_notify_at timestamptz,
  p_seen_at timestamptz,
  p_delivered boolean,
  p_updated_at timestamptz,
  p_mode text default null
)
returns feed_items
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_feed_item feed_items;
begin

-- update reminder

update global_reminders
set
  title = p_title,
  notes = p_notes,
  notify_at = p_notify_at,
  seen_at = p_seen_at,
  delivered = p_delivered,
  updated_at = p_updated_at,
  mode = COALESCE(p_mode, mode)
where id = p_id;

-- update feed item

update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'notify_at', p_notify_at, 'seen_at', p_seen_at, 'delivered', p_delivered, 'type', 'global', 'mode', COALESCE(p_mode, (extra_fields->>'mode'))),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'global_reminders'
 returning * into v_feed_item;

return v_feed_item;
end;
$$