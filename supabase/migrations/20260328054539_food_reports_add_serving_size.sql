-- Add reported_serving_size_g column to food_reports
ALTER TABLE food_reports
  ADD COLUMN reported_serving_size_g NUMERIC;

-- Update nutrition_report_food to accept serving size
DROP FUNCTION IF EXISTS nutrition_report_food(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT);
CREATE FUNCTION nutrition_report_food(
  p_food_id UUID,
  p_serving_size_g NUMERIC DEFAULT NULL,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL,
  p_report_image_url TEXT DEFAULT NULL,
  p_report_nutrition_label_url TEXT DEFAULT NULL,
  p_explanation TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO food_reports (
    food_id, reported_serving_size_g,
    reported_calories_per_100g, reported_protein_per_100g,
    reported_carbs_per_100g, reported_fat_per_100g,
    reported_saturated_fat_per_100g, reported_sugar_per_100g,
    reported_fiber_per_100g, reported_sodium_per_100g,
    report_image_url, report_nutrition_label_url, explanation
  ) VALUES (
    p_food_id, p_serving_size_g,
    p_calories_per_100g, p_protein_per_100g,
    p_carbs_per_100g, p_fat_per_100g,
    p_saturated_fat_per_100g, p_sugar_per_100g,
    p_fiber_per_100g, p_sodium_per_100g,
    p_report_image_url, p_report_nutrition_label_url, p_explanation
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Update admin_get_food_reports to return serving size
DROP FUNCTION IF EXISTS admin_get_food_reports(INT, INT, TEXT);
CREATE FUNCTION admin_get_food_reports(
  p_limit INT DEFAULT 15,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  food_id UUID,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  reported_serving_size_g NUMERIC,
  reported_calories_per_100g NUMERIC,
  reported_protein_per_100g NUMERIC,
  reported_carbs_per_100g NUMERIC,
  reported_fat_per_100g NUMERIC,
  reported_saturated_fat_per_100g NUMERIC,
  reported_sugar_per_100g NUMERIC,
  reported_fiber_per_100g NUMERIC,
  reported_sodium_per_100g NUMERIC,
  report_image_url TEXT,
  report_nutrition_label_url TEXT,
  explanation TEXT,
  food_name TEXT,
  brand TEXT,
  barcode TEXT,
  current_serving_size_g NUMERIC,
  current_calories_per_100g NUMERIC,
  current_protein_per_100g NUMERIC,
  current_carbs_per_100g NUMERIC,
  current_fat_per_100g NUMERIC,
  current_saturated_fat_per_100g NUMERIC,
  current_sugar_per_100g NUMERIC,
  current_fiber_per_100g NUMERIC,
  current_sodium_per_100g NUMERIC,
  image_url TEXT,
  nutrition_label_url TEXT,
  user_email TEXT,
  display_name TEXT
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
BEGIN
  IF NOT (auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    r.id, r.food_id, r.user_id, r.status, r.created_at,
    r.reported_serving_size_g,
    r.reported_calories_per_100g, r.reported_protein_per_100g,
    r.reported_carbs_per_100g, r.reported_fat_per_100g,
    r.reported_saturated_fat_per_100g, r.reported_sugar_per_100g,
    r.reported_fiber_per_100g, r.reported_sodium_per_100g,
    r.report_image_url, r.report_nutrition_label_url, r.explanation,
    f.name AS food_name, f.brand, f.barcode,
    f.serving_size_g AS current_serving_size_g,
    f.calories_per_100g AS current_calories_per_100g,
    f.protein_per_100g AS current_protein_per_100g,
    f.carbs_per_100g AS current_carbs_per_100g,
    f.fat_per_100g AS current_fat_per_100g,
    f.saturated_fat_per_100g AS current_saturated_fat_per_100g,
    f.sugar_per_100g AS current_sugar_per_100g,
    f.fiber_per_100g AS current_fiber_per_100g,
    f.sodium_per_100g AS current_sodium_per_100g,
    f.image_url, f.nutrition_label_url,
    u.email AS user_email, u.display_name
  FROM food_reports r
  JOIN foods f ON f.id = r.food_id
  LEFT JOIN users u ON u.id = r.user_id
  WHERE (p_status IS NULL OR r.status = p_status)
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Update admin_resolve_food_report to support serving size
DROP FUNCTION IF EXISTS admin_resolve_food_report(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT);
CREATE FUNCTION admin_resolve_food_report(
  p_report_id UUID,
  p_action TEXT,
  p_serving_size_g NUMERIC DEFAULT NULL,
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
      serving_size_g = COALESCE(p_serving_size_g, serving_size_g),
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
