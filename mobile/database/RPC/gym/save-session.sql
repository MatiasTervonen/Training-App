create or replace function gym_save_session(
p_exercises jsonb,
p_notes text,
p_duration integer,
p_title text,
p_start_time timestamptz,
p_end_time timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_session_id uuid;
 v_session_exercise_id uuid;
 v_exercise jsonb;
 v_sets jsonb;
 v_position integer;
 v_set_number integer;
begin


-- insert in to base session table

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
  (select id from activities where slug = 'gym')
)
returning id into v_session_id;

-- insert into gym session exercises

for v_exercise, v_position in 
  select elem, ordinality - 1 
  from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality)
loop

insert into gym_session_exercises (
  session_id,
  exercise_id,
  position,
  superset_id,
  notes
)
values (
  v_session_id,
  (v_exercise->> 'exercise_id')::uuid,
  v_position,
  nullif(v_exercise->> 'superset_id', '')::uuid,
  v_exercise->> 'notes'
)
returning id into v_session_exercise_id;


-- insert into gym sets

for v_sets, v_set_number in 
  select elem, ordinality - 1 
  from jsonb_array_elements(coalesce(v_exercise->'sets', '[]'::jsonb)) with ordinality as t(elem, ordinality)
loop

insert into gym_sets (
  session_exercise_id,
  weight,
  reps,
  rpe,
  set_number,
  time_min,
  distance_meters
)
values (
  v_session_exercise_id,
  (v_sets->> 'weight')::numeric,
  (v_sets->> 'reps')::integer,
  (v_sets->> 'rpe')::text,
  v_set_number,
  (v_sets->> 'time_min')::numeric,
  (v_sets->> 'distance_meters')::numeric
);

 end loop;

end loop;

-- compute session stats
perform activities_compute_session_stats(v_session_id, null);


-- insert into feed item_id

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'gym_sessions',
  jsonb_build_object('start_time', p_start_time, 'end_time', p_end_time, 'duration', p_duration,'exercises_count', jsonb_array_length(p_exercises), 'sets_count', (select coalesce(sum(jsonb_array_length(e->'sets')), 0)
  from jsonb_array_elements(p_exercises) as t(e))),
  v_session_id,
  p_start_time
);


return v_session_id;
end;
$$