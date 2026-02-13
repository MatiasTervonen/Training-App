create or replace function last_30d_analytics()
returns jsonb
security invoker
language sql
set search_path = public
as $$
  with all_muscle_groups as (
    select unnest(array[
      'abs', 'biceps', 'calves', 'chest', 'forearms', 'front_delts',
      'glutes', 'hamstrings', 'lats', 'lower_back', 'obliques',
      'quads', 'rear_delts', 'side_delts', 'traps', 'triceps', 'upper_back'
    ]) as muscle_group
  ),
  user_sessions as (
    select id
    from sessions
    where user_id = auth.uid()
      and activity_id = '3de3db15-6b0a-4338-a276-396782c12c63'
      and created_at > now() - interval '30 days'
  ),
  exercise_counts as (
    select
      ge.muscle_group,
      count(*) as group_count
    from gym_session_exercises gse
    join gym_exercises ge on ge.id = gse.exercise_id
    where gse.session_id in (select id from user_sessions)
    group by ge.muscle_group
  ),
  set_counts as (
    select
      ge.muscle_group,
      count(*) as group_count
    from gym_session_exercises gse
    join gym_exercises ge on ge.id = gse.exercise_id
    join gym_sets gs on gs.session_exercise_id = gse.id
    where gse.session_id in (select id from user_sessions)
    group by ge.muscle_group
  )
  select jsonb_build_object(
    'total_sessions', count(*),
    'avg_duration', coalesce(avg(duration), 0),
    'muscle_groups', (
      select jsonb_agg(
        jsonb_build_object(
          'group', amg.muscle_group,
          'count', coalesce(ec.group_count, 0)
        )
      )
      from all_muscle_groups amg
      left join exercise_counts ec on ec.muscle_group = amg.muscle_group
    ),
    'sets_per_muscle_group', (
      select jsonb_agg(
        jsonb_build_object(
          'group', amg.muscle_group,
          'count', coalesce(sc.group_count, 0)
        )
      )
      from all_muscle_groups amg
      left join set_counts sc on sc.muscle_group = amg.muscle_group
    )
  )
  from sessions
  where user_id = auth.uid()
    and activity_id = '3de3db15-6b0a-4338-a276-396782c12c63'
    and created_at > now() - interval '30 days';
$$;