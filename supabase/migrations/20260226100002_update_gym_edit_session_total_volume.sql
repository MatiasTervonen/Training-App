-- Drop the old function first (exact old signature)
DROP FUNCTION IF EXISTS gym_edit_session(jsonb, text, integer, text, uuid, timestamp with time zone);

CREATE FUNCTION gym_edit_session(
  p_exercises jsonb,
  p_notes text,
  p_duration integer,
  p_title text,
  p_id uuid,
  p_updated_at timestamp with time zone
) RETURNS feed_items
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
  v_feed_item feed_items;
  v_total_volume numeric;
begin

update sessions
set
  title = p_title,
  notes = p_notes,
  duration = p_duration,
  updated_at = p_updated_at
where id = p_id
returning id into v_session_id;

if not found then
  raise exception 'Session not found';
end if;

delete from gym_sets
 where session_exercise_id in (
  select id
  from gym_session_exercises
  where session_id = v_session_id
 );

delete from gym_session_exercises
 where session_id = v_session_id;

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

-- Recompute total volume from the exercises JSON
v_total_volume := (
  SELECT coalesce(sum((s->>'weight')::numeric * (s->>'reps')::integer), 0)
  FROM jsonb_array_elements(p_exercises) AS e,
       jsonb_array_elements(coalesce(e->'sets', '[]'::jsonb)) AS s
  WHERE (s->>'weight') IS NOT NULL
    AND (s->>'reps') IS NOT NULL
);

-- Update total_volume in session_stats
UPDATE session_stats
SET total_volume = v_total_volume
WHERE session_id = v_session_id;

update feed_items
set
  title = p_title,
  extra_fields = jsonb_build_object('duration', p_duration,'exercises_count', jsonb_array_length(p_exercises), 'sets_count', (select coalesce(sum(jsonb_array_length(e->'sets')), 0)
  from jsonb_array_elements(p_exercises) as t(e)))
where source_id = p_id
 and type = 'gym_sessions'
 returning * into v_feed_item;

return v_feed_item;
end;
$$;
