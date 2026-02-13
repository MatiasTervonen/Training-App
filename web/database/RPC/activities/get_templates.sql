create or replace function activities_get_templates()
    returns jsonb
    language sql
    security invoker
    stable
    as $$
    select coalesce(
     jsonb_agg(
        jsonb_build_object(
        'template',
        to_jsonb(t) - 'geom',

        'activity',
        jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug
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