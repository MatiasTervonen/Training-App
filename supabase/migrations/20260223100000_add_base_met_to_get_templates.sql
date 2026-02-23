-- Add base_met to activities_get_templates so the mobile app can show live calories
-- for template-started sessions.

DROP FUNCTION IF EXISTS activities_get_templates();

CREATE FUNCTION activities_get_templates() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public', 'extensions'
    AS $$
    select coalesce(
     jsonb_agg(
        jsonb_build_object(
        'template',
        to_jsonb(t) - 'geom',

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
   where t.user_id = auth.uid();
$$;
