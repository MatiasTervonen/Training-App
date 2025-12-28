create or replace function gym_save_template(
p_exercises jsonb,
p_name text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_template_id uuid;
begin

-- insert template 

insert into gym_templates (
  name
)
values (
  p_name
)
returning id into v_template_id;

-- insert template exercises

insert into gym_template_exercises (
  template_id,
  exercise_id,
  position,
  superset_id
)
select
  v_template_id,
  (elem->> 'exercise_id')::uuid as exercise_id,
  ordinality - 1 as position,
  (elem->> 'superset_id')::uuid as superset_id
from jsonb_array_elements(p_exercises) with ordinality as t(elem, ordinality);

return v_template_id;
end;
$$