-- Add hidden_at column to feed_items
ALTER TABLE feed_items ADD COLUMN hidden_at TIMESTAMPTZ DEFAULT NULL;

-- Drop and recreate get_feed_sorted to filter out hidden items
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
  user_id uuid
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
    and (feed_items.extra_fields->>'notify_at')::timestamptz <= now()
    and feed_items.occurred_at < (feed_items.extra_fields->>'notify_at')::timestamptz;

  -- Return feed sorted by activity_at, excluding hidden items
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
    f.user_id
  from feed_items f
  where f.hidden_at is null
  order by f.activity_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Create hide_feed_item RPC function
DROP FUNCTION IF EXISTS hide_feed_item(uuid);

CREATE FUNCTION hide_feed_item(p_feed_item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE feed_items
  SET hidden_at = now()
  WHERE id = p_feed_item_id AND user_id = auth.uid();
$$;
