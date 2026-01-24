create or replace function reminders_get_by_tab(p_tab text)
returns table (
  id uuid,
  title text,
  notes text,
  type text,
  notify_at timestamptz,
  notify_date timestamptz,
  notify_at_time time,
  weekdays json,
  delivered boolean,
  seen_at timestamptz,
  mode text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_tab = 'normal' then
    -- Upcoming one-time reminders (not yet delivered)
    return query
      select lr.id, lr.title, lr.notes, 'one-time'::text, null::timestamptz, lr.notify_date::timestamptz, null::time, null::json, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type = 'one-time' and lr.notify_date > now()
      union all
      select gr.id, gr.title, gr.notes, 'global'::text, gr.notify_at, null::timestamptz, null::time, null::json, gr.delivered, gr.seen_at, null::text, gr.created_at::timestamptz, gr.updated_at
      from global_reminders gr
      where gr.delivered = false;

  elsif p_tab = 'repeating' then
    return query
      select lr.id, lr.title, lr.notes, lr.type, null::timestamptz, null::timestamptz, lr.notify_at_time, lr.weekdays, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type in ('daily', 'weekly');

  elsif p_tab = 'delivered' then
    return query
      select lr.id, lr.title, lr.notes, 'one-time'::text, null::timestamptz, lr.notify_date::timestamptz, null::time, null::json, lr.delivered, lr.seen_at, lr.mode, lr.created_at::timestamptz, lr.updated_at
      from local_reminders lr
      where lr.type = 'one-time' and lr.notify_date <= now()
      union all
      select gr.id, gr.title, gr.notes, 'global'::text, gr.notify_at, null::timestamptz, null::time, null::json, gr.delivered, gr.seen_at, null::text, gr.created_at::timestamptz, gr.updated_at
      from global_reminders gr
      where gr.delivered = true;
  end if;
end;
$$
