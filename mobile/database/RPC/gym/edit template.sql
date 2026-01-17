create or replace function gym_edit_template(
p_id uuid,
p_exercises jsonb,
p_name text,
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_template_id uuid;
 v_exercise jsonb;
 v_position integer;
begin

-- update gym template 

update gym_templates 
set 
  name = p_name,
  updated_at = now()
where id = p_id
returning id into v_template_id;

if not found then
  raise exception 'Template not found';
end if;

 -- delete from gym template exercises

delete from gym_template_exercises 
 where template_id = v_template_id;

-- insert into gym template exercises

for v_exercise, v_position in 
  select elem, ordinality - 1 
  from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality)
loop

insert into gym_template_exercises (
  template_id,
  exercise_id,
  position,
  superset_id
)
values (
  v_template_id,
  (v_exercise->> 'exercise_id')::uuid,
  v_position,
  nullif(v_exercise->> 'superset_id', '')::uuid
);

end loop;

return v_template_id;
end;
$$