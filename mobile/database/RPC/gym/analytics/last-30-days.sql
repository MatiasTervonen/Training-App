create or replace function last_30d_analytics()
returns jsonb
security invoker
language sql
set search_path = public
as $$
  select jsonb_build_object(
    'total_sessions', count(*),
    'avg_duration', avg(duration),
    'muscle_groups', (
      select jsonb_agg(
               jsonb_build_object(
                 'group', muscle_group,
                 'count', group_count
               )
             )
      from (
        select 
          ge.muscle_group,
          count(*) as group_count
        from gym_session_exercises gse
        join gym_exercises ge 
          on ge.id = gse.exercise_id
        where gse.session_id in (
          select id 
          from gym_sessions
          where user_id = auth.uid()
          and created_at > now() - interval '30 days'
        )
        group by ge.muscle_group
      ) mg
    ),
    'sets_per_muscle_group', (
     select jsonb_agg(
      jsonb_build_object(
        'group', muscle_group,
        'count', group_count
      )
     )
     from (
      select
      ge.muscle_group,
      count(*) as group_count
     from gym_session_exercises as gse
      join gym_exercises as ge 
          on ge.id = gse.exercise_id
     join gym_sets as gs 
      on gs.session_exercise_id = gse.id
     where gse.session_id in (
      select id
      from gym_sessions
      where user_id = auth.uid()
      and created_at > now() - interval '30 days'   
     ) 
     group by ge.muscle_group
     ) mg 
    )
  )
  from gym_sessions
  where user_id = auth.uid()
    and created_at > now() - interval '30 days';
$$;