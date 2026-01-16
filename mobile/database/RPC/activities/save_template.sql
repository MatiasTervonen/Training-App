create or replace function activities_save_template(
    p_name text,
    p_notes text,
    p_session_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_template_id uuid;
begin
    insert into activity_templates (
        user_id,
        activity_id,
        name,  
        notes,
        geom,
        distance_meters
    )
    select 
        s.user_id,
        s.activity_id,
        p_name,
        p_notes,
        s.geom,
        st.distance_meters
    from activity_sessions s
    join activity_session_stats st on st.session_id = s.id
    where s.id = p_session_id
      and s.user_id = auth.uid()
      and s.geom is not null
      returning id
    into v_template_id;

      if v_template_id is null then
    raise exception 'Session not found or not owned by user';
  end if;

-- update session with template id

update activity_sessions s
set template_id = v_template_id
where s.id = p_session_id
 and s.user_id = auth.uid();

    return v_template_id;
end;
$$;