create or replace function activities_compute_session_stats(
    p_session_id uuid
) 
returns void
language plpgsql 
security invoker
as $$
declare
    v_distance numeric := 0;
    v_moving_time_seconds numeric := 0;
begin

   with ordered_points as (
        select 
        recorded_at, 
        latitude, 
        longitude, 
            lag(latitude) over w as prev_latitude,
            lag(longitude) over w as prev_longitude,
            lag(recorded_at) over w as prev_time
        from activity_gps_points
        where session_id = p_session_id
        window w as (order by recorded_at)
    ), 
    deltas as (
        select 
        extract(epoch from (recorded_at - prev_time)) as delta_time,
        6371000 * 2 * asin(
            sqrt(
                power(sin(radians(latitude - prev_latitude) / 2), 2) +
                cos(radians(latitude)) * cos(radians(prev_latitude)) * 
                power(sin(radians(longitude - prev_longitude) / 2), 2)
            )
        ) as delta_distance
        from ordered_points
        where prev_time is not null
    ),
    moving_segments as (
        select
            delta_time,
            delta_distance
        from deltas
        where delta_time > 0 
        and delta_distance / delta_time > 0.6
        )
        select 
            coalesce(sum(delta_distance), 0),
            coalesce(sum(delta_time), 0)
        into 
            v_distance, 
            v_moving_time_seconds
        from moving_segments;


        insert into activity_session_stats (
            session_id,
            distance_meters,
            moving_time_seconds,
            avg_pace,
            computed_at
        )
        values (
            p_session_id,
            v_distance,
            v_moving_time_seconds,
            case
                when v_distance > 0 
                then v_moving_time_seconds / (v_distance / 1000)
                else null
            end,
            now()
        )
        on conflict (session_id) do update 
        set
            distance_meters = excluded.distance_meters,
            moving_time_seconds = excluded.moving_time_seconds,
            avg_pace = excluded.avg_pace,
            computed_at = excluded.computed_at;

end;
$$;