create or replace function weight_save_weight(
  p_title text,
  p_notes text,
  p_weight numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_weight_id uuid;
begin

-- insert weight 

insert into weight (
  title, 
  notes,
  weight
)
values (
  p_title,
  p_notes,
  p_weight
)
returning id into v_weight_id;

-- insert into feed item

insert into feed_items (
  title,
  type,
  extra_fields,
  source_id,
  occurred_at
)
values (
  p_title,
  'weight',
  jsonb_build_object('notes', p_notes, 'weight', p_weight),
  v_weight_id,
  now()
);

return v_weight_id;
end;
$$