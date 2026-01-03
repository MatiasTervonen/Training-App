create or replace function activities_save_activity(
    p_title text,
    p_notes text,
    p_duration integer,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_track jsonb,
    p_activity_id uuid,
    p_meters numeric
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
begin 

    -- insert into activities

  insert into activity_session (
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

insert into activity_session_stats (
  session_id,
  distance_meters,
  duration_seconds
)
values (
  v_activity_id,
  p_meters,
  p_duration
);

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

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'activity_session',
  jsonb_build_object('duration', p_duration, 'start_time', p_start_time, 'end_time', p_end_time, 'meters', p_meters),
  v_activity_id,
  p_start_time
);


return v_activity_id;
end;
$$;