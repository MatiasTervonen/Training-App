-- Drop the old function first (exact old signature)
DROP FUNCTION IF EXISTS gym_save_session(jsonb, text, integer, text, timestamp with time zone, timestamp with time zone);

CREATE FUNCTION gym_save_session(
  p_exercises jsonb,
  p_notes text,
  p_duration integer,
  p_title text,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone
) RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
declare
  v_session_id uuid;
  v_session_exercise_id uuid;
  v_exercise jsonb;
  v_sets jsonb;
  v_position integer;
  v_set_number integer;
  v_total_volume numeric;
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
  (select id from activities where slug = 'gym')
)
returning id into v_session_id;

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

-- Compute total volume from the exercises JSON
v_total_volume := (
  SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
  FROM jsonb_array_elements(p_exercises) AS e,
       jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
  WHERE (s->>'weight') IS NOT NULL
    AND (s->>'reps') IS NOT NULL
);

-- Compute session stats (calories, etc.)
perform activities_compute_session_stats(v_session_id, null);

-- Update total_volume in session_stats (row was just created by compute above)
UPDATE session_stats
SET total_volume = v_total_volume
WHERE session_id = v_session_id;

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
$$;
