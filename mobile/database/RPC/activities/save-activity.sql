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
set search_path = public
as $$
declare
    v_activity_id uuid;
    v_track jsonb;
    v_position integer;
    v_distance numeric;
begin 


  insert into activity_sessions (
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
    altitude
  )
  values (
    v_activity_id,
    (v_track->> 'timestamp')::timestamptz,
    (v_track->> 'latitude')::numeric,
    (v_track->> 'longitude')::numeric,
    (v_track->> 'accuracy')::numeric,
    (v_track->> 'altitude')::numeric
  );

end loop;
end if;

if p_track is not null then 
  update activity_sessions s 
  set geom = (
    select ST_MakeLine(
    ST_SetSRID(
        ST_MakePoint(p.longitude, p.latitude),
        4326
      )::geography
    order by p.recorded_at
    )
    from activity_gps_points p
    where p.session_id = s.id
  )
  where s.id = v_activity_id;
end if;

-- Always compute stats (for steps even without track)
perform activities_compute_session_stats(v_activity_id, p_steps);

-- Get distance only if we had track data
if p_track is not null then
  select distance_meters into v_distance
  from activity_session_stats
  where session_id = v_activity_id;
end if;

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
  jsonb_build_object('duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time, 'distance', v_distance),
  v_activity_id,
  p_start_time
);


return v_activity_id;
end;
$$;