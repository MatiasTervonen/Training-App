create or replace function last_30d_analytics()
returns jsonb
security invoker
language sql
set search_path = public
as $$
  select jsonb_build_object(
    'total_sessions', count(*),
    'avg_duration', avg(s.duration),

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
        join gym_exercises ge on ge.id = gse.exercise_id
        join sessions s2 on s2.id = gse.session_id
        join activities a2 on a2.id = s2.activity_id
          where s2.user_id = auth.uid()
          and a2.slug = 'gym'
          and s2.created_at > now() - interval '30 days'
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
    join gym_exercises as ge  on ge.id = gse.exercise_id
    join gym_sets as gs on gs.session_exercise_id = gse.id
    join sessions s3 on s3.id = gse.session_id
    join activities a3 on a3.id = s3.activity_id
      where s3.user_id = auth.uid()
      and a3.slug = 'gym'
      and s3.created_at > now() - interval '30 days'   
     
     group by ge.muscle_group
     ) sg 
    )
  )

  from sessions s
  join activities a on a.id = s.activity_id
  where s.user_id = auth.uid()
  and a.slug = 'gym'
    and s.created_at > now() - interval '30 days';
$$;