create or replace function activities_save_activity(
    p_title text,
    p_notes text,
    p_duration integer,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_track jsonb,
    p_activity_id uuid,
    p_steps integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
    v_activity_id uuid;
    v_activity_name text;
    v_activity_slug text;
    v_track jsonb;
    v_position integer;
    v_distance numeric;
begin 


  insert into sessions (
    title,
    notes,
    duration,
    start_time,
    end_time,
    activity_id
  )  
  values (
    p_title,
    p_notes,
    p_duration,
    p_start_time,
    p_end_time,
    p_activity_id
  )
  returning id into v_activity_id;

-- insert into activity_gps_points if track is not null
if p_track is not null then
for v_track, v_position in 
  select elem, ordinality - 1 
from jsonb_array_elements(p_track) with ordinality as t(elem, ordinality)
loop


  insert into activity_gps_points (
    session_id,
    recorded_at,
    latitude,
    longitude,
    accuracy,
    altitude,
    is_stationary,
    bad_signal
  )
  values (
    v_activity_id,
    (v_track->> 'timestamp')::timestamptz,
    (v_track->> 'latitude')::numeric,
    (v_track->> 'longitude')::numeric,
    (v_track->> 'accuracy')::numeric,
    (v_track->> 'altitude')::numeric,
    coalesce((v_track->> 'is_stationary')::boolean, false),
    coalesce((v_track->> 'bad_signal')::boolean, false)
  );

end loop;
end if;

-- Create route geometry, splitting into segments at time gaps (>60 seconds)
-- Uses ALL points for gap detection, but only MOVING + GOOD SIGNAL points in geometry
if p_track is not null then
  update sessions s
  set geom = (
    with points_with_gaps as (
      -- Use ALL points (including stationary/bad_signal) for gap detection
      select
        p.longitude,
        p.latitude,
        p.recorded_at,
        p.is_stationary,
        p.bad_signal,
        case
          when extract(epoch from (p.recorded_at - lag(p.recorded_at) over (order by p.recorded_at))) > 60
          then 1
          else 0
        end as is_gap
      from activity_gps_points p
      where p.session_id = v_activity_id
    ),
    points_with_segments as (
      select
        longitude,
        latitude,
        recorded_at,
        is_stationary,
        bad_signal,
        sum(is_gap) over (order by recorded_at) as segment_id
      from points_with_gaps
    ),
    segment_lines as (
      -- Only include MOVING + GOOD SIGNAL points in the geometry
      select
        segment_id,
        ST_MakeLine(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
          order by recorded_at
        ) as line
      from points_with_segments
      where not is_stationary and not bad_signal
      group by segment_id
      having count(*) >= 2
    )
    select
      case
        when count(*) = 1 then (array_agg(line))[1]::geography
        else ST_Collect(line order by segment_id)::geography
      end
    from segment_lines
  )
  where s.id = v_activity_id;
end if;

-- Always compute stats (for steps even without track)
perform activities_compute_session_stats(v_activity_id, p_steps);

-- Get distance only if we had track data
if p_track is not null then
  select distance_meters into v_distance
  from session_stats
  where session_id = v_activity_id;
end if;

select name, slug
into v_activity_name, v_activity_slug
from activities
where id = p_activity_id;

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'activity_sessions',
  jsonb_build_object('duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time, 'distance', v_distance, 'activity_name', v_activity_name, 'activity_slug', v_activity_slug),
  v_activity_id,
  p_start_time
);


return v_activity_id;
end;
$$;