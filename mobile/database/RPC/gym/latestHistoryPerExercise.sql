create or replace function gym_latest_history_per_exercise(
  exercise_ids uuid[]
)
returns table (
  exercise_id uuid,
  created_at timestamptz,
  main_group text,
  name text,
  equipment text,
  sets jsonb
)
language sql
security invoker
as $$
  select distinct on (se.exercise_id)
    se.exercise_id,
    s.created_at,
    e.main_group,
    e.name,
    e.equipment,
    jsonb_agg(
      jsonb_build_object(
        'set_number', gs.set_number,
        'weight', gs.weight,
        'reps', gs.reps,
        'rpe', gs.rpe,
        'time_min', gs.time_min,
        'distance_meters', gs.distance_meters
      )
      order by gs.set_number
    ) as sets
  from gym_session_exercises se
  join gym_sessions s on s.id = se.session_id
  join gym_exercises e on e.id = se.exercise_id
  left join gym_sets gs on gs.session_exercise_id = se.id
  where se.exercise_id = any(exercise_ids)
    and s.user_id = auth.uid()
  group by
    se.exercise_id,
    s.created_at,
    e.main_group,
    e.name,
    e.equipment
  order by
    se.exercise_id,
    s.created_at desc;
$$;