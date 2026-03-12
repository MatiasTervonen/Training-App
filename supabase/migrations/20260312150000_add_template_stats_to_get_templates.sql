-- Extend activities_get_templates with aggregated stats from past sessions:
-- last_completed_at, times_completed, avg_duration, avg_pace, avg_speed, avg_distance

DROP FUNCTION IF EXISTS activities_get_templates();

CREATE FUNCTION activities_get_templates() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY INVOKER
    SET search_path TO 'public', 'extensions'
    AS $$
    select coalesce(
     jsonb_agg(
        jsonb_build_object(
        'template',
        to_jsonb(t) - 'geom'
          || jsonb_build_object(
            'last_completed_at', agg.last_completed_at,
            'times_completed', coalesce(agg.times_completed, 0),
            'avg_duration', agg.avg_duration,
            'avg_pace', agg.avg_pace,
            'avg_speed', agg.avg_speed,
            'avg_distance', agg.avg_distance
          ),

        'activity',
        jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug,
        'base_met', a.base_met
        ),

        'route',
        case
            when t.geom is not null
            then ST_AsGeoJSON(t.geom)::jsonb
            else null
        end
        )
        order by t.created_at desc
    ),
     '[]'::jsonb
     )
   from activity_templates t
   join activities a on t.activity_id = a.id
   left join lateral (
     select
       max(s.start_time) as last_completed_at,
       count(*)::int as times_completed,
       avg(s.duration) as avg_duration,
       avg(ss.avg_pace) filter (where ss.avg_pace is not null) as avg_pace,
       avg(ss.avg_speed) filter (where ss.avg_speed is not null) as avg_speed,
       avg(ss.distance_meters) filter (where ss.distance_meters is not null) as avg_distance
     from sessions s
     join session_stats ss on ss.session_id = s.id
     where s.template_id = t.id
       and s.user_id = auth.uid()
   ) agg on true
   where t.user_id = auth.uid();
$$;
