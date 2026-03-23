-- Recreate dashboard RPCs to exclude guest users from all counts

-- Drop and recreate get_admin_dashboard_stats
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();
CREATE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_role TEXT;
  v_result JSON;
BEGIN
  SELECT (auth.jwt()->'app_metadata'->>'role') INTO v_role;
  IF v_role IS NULL OR v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'active_5m',  COUNT(*) FILTER (
      WHERE last_active_at > now() - interval '5 minutes'
         OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours')
    ),
    'active_15m', COUNT(*) FILTER (
      WHERE last_active_at > now() - interval '15 minutes'
         OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours')
    ),
    'active_1h',  COUNT(*) FILTER (
      WHERE last_active_at > now() - interval '1 hour'
         OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours')
    ),
    'active_24h', COUNT(*) FILTER (
      WHERE last_active_at > now() - interval '24 hours'
         OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours')
    ),
    'total_users', COUNT(*),
    'web_active', COUNT(*) FILTER (
      WHERE platform = 'web'
        AND (last_active_at > now() - interval '24 hours'
             OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours'))
    ),
    'mobile_active', COUNT(*) FILTER (
      WHERE platform = 'mobile'
        AND (last_active_at > now() - interval '24 hours'
             OR (is_tracking_activity = true AND last_active_at > now() - interval '12 hours'))
    ),
    'new_today',      COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours'),
    'new_this_week',  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days'),
    'new_this_month', COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')
  ) INTO v_result
  FROM users
  WHERE role != 'guest';

  RETURN v_result;
END;
$$;

-- Drop and recreate get_admin_user_growth
DROP FUNCTION IF EXISTS get_admin_user_growth(INT);
CREATE FUNCTION get_admin_user_growth(p_days INT DEFAULT 30)
RETURNS TABLE(day DATE, cumulative_users BIGINT, new_users BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT (auth.jwt()->'app_metadata'->>'role') INTO v_role;
  IF v_role IS NULL OR v_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH daily_signups AS (
    SELECT created_at::date AS signup_day, COUNT(*) AS cnt
    FROM users
    WHERE created_at >= now() - (p_days || ' days')::interval
      AND role != 'guest'
    GROUP BY signup_day
  ),
  date_series AS (
    SELECT generate_series(
      (now() - (p_days || ' days')::interval)::date,
      now()::date,
      '1 day'::interval
    )::date AS d
  )
  SELECT
    ds.d AS day,
    (SELECT COUNT(*) FROM users WHERE created_at::date <= ds.d AND role != 'guest') AS cumulative_users,
    COALESCE(s.cnt, 0) AS new_users
  FROM date_series ds
  LEFT JOIN daily_signups s ON s.signup_day = ds.d
  ORDER BY ds.d;
END;
$$;
