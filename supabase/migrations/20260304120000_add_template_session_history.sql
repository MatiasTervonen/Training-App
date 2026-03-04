-- Drop function first (per CLAUDE.md rules)
DROP FUNCTION IF EXISTS activities_get_template_history(uuid);

CREATE FUNCTION activities_get_template_history(p_template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_data ORDER BY start_time DESC)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'session_id', s.id,
      'title', s.title,
      'start_time', s.start_time,
      'duration', s.duration,
      'distance_meters', ss.distance_meters,
      'moving_time_seconds', ss.moving_time_seconds,
      'avg_pace', ss.avg_pace,
      'avg_speed', ss.avg_speed,
      'calories', ss.calories,
      'steps', ss.steps
    ) AS row_data,
    s.start_time
    FROM sessions s
    LEFT JOIN session_stats ss ON ss.session_id = s.id
    WHERE s.template_id = p_template_id
      AND s.user_id = auth.uid()
    ORDER BY s.start_time DESC
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
