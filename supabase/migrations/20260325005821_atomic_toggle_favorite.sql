CREATE OR REPLACE FUNCTION nutrition_toggle_favorite(
  p_food_id UUID DEFAULT NULL,
  p_custom_food_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_deleted INT;
BEGIN
  -- Try to delete first (atomic check + remove)
  IF p_food_id IS NOT NULL THEN
    DELETE FROM favorite_foods
    WHERE user_id = auth.uid() AND food_id = p_food_id;
  ELSIF p_custom_food_id IS NOT NULL THEN
    DELETE FROM favorite_foods
    WHERE user_id = auth.uid() AND custom_food_id = p_custom_food_id;
  ELSE
    RAISE EXCEPTION 'Either p_food_id or p_custom_food_id must be provided';
  END IF;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- If nothing was deleted, it wasn't a favorite — insert it
  IF v_deleted = 0 THEN
    INSERT INTO favorite_foods (food_id, custom_food_id)
    VALUES (p_food_id, p_custom_food_id);
    RETURN TRUE; -- now a favorite
  END IF;

  RETURN FALSE; -- removed from favorites
END;
$$;
