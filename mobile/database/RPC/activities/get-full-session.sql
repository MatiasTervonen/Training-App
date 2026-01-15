create or replace function activities_get_full_session(
    p_session_id uuid
    )
    returns jsonb
    language sql
    security invoker
    stable
    as $$

    select jsonb_build_object(
        'session',
        to_jsonb(s) - 'geom',


        'route',
        case 
            when s.geom is not null 
            then ST_AsGeoJSON(s.geom)::jsonb
            else null
        end,

        'activity',
        to_jsonb(a),

        'stats',
        to_jsonb(st)     
    )
    from activity_sessions s
    left join activities a on s.activity_id = a.id
    left join activity_session_stats st on s.id = st.session_id
    where s.id = p_session_id
    group by s.id, a.id, st.id;
    $$;