-- Add visibility column to get_feed_sorted so the main feed can show
-- a share indicator on posts shared to the social feed.

DROP FUNCTION IF EXISTS get_feed_sorted(integer, integer);

CREATE FUNCTION get_feed_sorted(p_limit integer, p_offset integer)
RETURNS TABLE(
  id uuid,
  title text,
  type text,
  extra_fields jsonb,
  source_id uuid,
  occurred_at timestamptz,
  updated_at timestamptz,
  activity_at timestamptz,
  created_at timestamptz,
  user_id uuid,
  visibility text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
begin
  -- Bump overdue reminders by setting occurred_at to notify_at (one-time)
  -- This automatically updates activity_at via the generated column
  update feed_items
  set occurred_at = (feed_items.extra_fields->>'notify_at')::timestamptz
  where feed_items.type in ('global_reminders', 'local_reminders')
    and feed_items.user_id = auth.uid()
    and (feed_items.extra_fields->>'notify_at')::timestamptz <= now()
    and feed_items.occurred_at < (feed_items.extra_fields->>'notify_at')::timestamptz;

  -- Return feed sorted by activity_at, only own items, excluding hidden items
  return query
  select
    f.id,
    f.title,
    f.type,
    f.extra_fields,
    f.source_id,
    f.occurred_at,
    f.updated_at,
    f.activity_at,
    f.created_at,
    f.user_id,
    f.visibility
  from feed_items f
  where f.user_id = auth.uid()
    and f.hidden_at is null
  order by f.activity_at desc
  limit p_limit
  offset p_offset;
end;
$$;
