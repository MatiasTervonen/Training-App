-- Update admin_resolve_food_report to support image updates
DROP FUNCTION IF EXISTS admin_resolve_food_report;
CREATE FUNCTION admin_resolve_food_report(
  p_report_id UUID,
  p_action TEXT,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL,
  p_image_url TEXT DEFAULT '__KEEP__',
  p_nutrition_label_url TEXT DEFAULT '__KEEP__'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_food_id UUID;
BEGIN
  IF NOT (auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE food_reports SET status = p_action WHERE id = p_report_id
  RETURNING food_id INTO v_food_id;

  IF p_action = 'accepted' THEN
    UPDATE foods SET
      calories_per_100g = COALESCE(p_calories_per_100g, calories_per_100g),
      protein_per_100g = COALESCE(p_protein_per_100g, protein_per_100g),
      carbs_per_100g = COALESCE(p_carbs_per_100g, carbs_per_100g),
      fat_per_100g = COALESCE(p_fat_per_100g, fat_per_100g),
      saturated_fat_per_100g = COALESCE(p_saturated_fat_per_100g, saturated_fat_per_100g),
      sugar_per_100g = COALESCE(p_sugar_per_100g, sugar_per_100g),
      fiber_per_100g = COALESCE(p_fiber_per_100g, fiber_per_100g),
      sodium_per_100g = COALESCE(p_sodium_per_100g, sodium_per_100g),
      image_url = CASE WHEN p_image_url = '__KEEP__' THEN image_url ELSE p_image_url END,
      nutrition_label_url = CASE WHEN p_nutrition_label_url = '__KEEP__' THEN nutrition_label_url ELSE p_nutrition_label_url END
    WHERE id = v_food_id;
  END IF;
END;
$$;
