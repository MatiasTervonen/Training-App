create or replace function activities_compute_session_stats(
    p_session_id uuid,
    p_steps integer
) 
returns void
language plpgsql 
security invoker
as $$
declare
    v_distance numeric := 0;
    v_moving_time_seconds numeric := 0;
    v_duration_seconds numeric;        
    v_base_met numeric;                
    v_user_weight_kg numeric;          
    v_calories numeric;
begin

   with ordered_points as (
        select
        recorded_at,
        latitude,
        longitude,
            lag(latitude) over w as prev_latitude,
            lag(longitude) over w as prev_longitude,
            lag(recorded_at) over w as prev_time,
            is_stationary
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
        ) as delta_distance,
        is_stationary
        from ordered_points
        where prev_time is not null
    ),
    moving_segments as (
        select
            delta_time,
            delta_distance
        from deltas
        where delta_time > 0
        and is_stationary = false
        )
        select 
            coalesce(sum(delta_distance), 0),
            coalesce(sum(delta_time), 0)
        into 
            v_distance, 
            v_moving_time_seconds
        from moving_segments;


        -- Calculate calories here if needed
        select 
            s.duration,
            a.base_met,
            coalesce(
            (select weight
            from weight
            where user_id = s.user_id
            order by created_at desc
            limit 1), 70    
            )
        into 
            v_duration_seconds,
            v_base_met,
            v_user_weight_kg
        from sessions s 
        join activities a on s.activity_id = a.id
        where s.id = p_session_id;       

        if v_moving_time_seconds > 0 then
            -- GPS tracked: use moving time (more accurate)
            v_calories := v_base_met * v_user_weight_kg * (v_moving_time_seconds / 3600);
        else
            -- No GPS: use total session duration
            v_calories := v_base_met * v_user_weight_kg * (v_duration_seconds / 3600);
        end if;


        insert into session_stats (
            session_id,
            distance_meters,
            moving_time_seconds,
            avg_pace,
            avg_speed,
            steps,
            calories,
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
            case
                when v_moving_time_seconds > 0
                then (v_distance / 1000) / (v_moving_time_seconds / 3600)
                else null
            end,
            p_steps,
            v_calories,
            now()
        )
        on conflict (session_id) do update
        set
            distance_meters = excluded.distance_meters,
            moving_time_seconds = excluded.moving_time_seconds,
            avg_pace = excluded.avg_pace,
            avg_speed = excluded.avg_speed,
            steps = excluded.steps,
            calories = excluded.calories,
            computed_at = excluded.computed_at;
end;
$$;