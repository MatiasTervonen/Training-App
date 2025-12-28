create or replace function weight_edit_weight(
  p_id uuid,
  p_title text,
  p_notes text,
  p_weight numeric,
  p_updated_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
 v_weight_id uuid;
begin

-- update weight 

update weight 
set 
  title = p_title,
  notes = p_notes,
  weight = p_weight,
  updated_at = p_updated_at
where id = p_id
returning id into v_weight_id;

-- update feed item

update feed_items 
set
  title = p_title,
  extra_fields = jsonb_build_object('notes', p_notes, 'weight', p_weight),
  updated_at = p_updated_at
where source_id = p_id
 and type = 'weight';

return v_weight_id;
end;
$$