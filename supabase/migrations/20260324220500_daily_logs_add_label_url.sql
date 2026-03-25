-- Add nutrition_label_url to daily logs RPC return

DROP FUNCTION IF EXISTS nutrition_get_daily_logs(DATE);

CREATE FUNCTION nutrition_get_daily_logs(p_date DATE)
RETURNS TABLE (
  id UUID,
  food_name TEXT,
  brand TEXT,
  meal_type TEXT,
  serving_size_g NUMERIC,
  quantity NUMERIC,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  notes TEXT,
  is_custom BOOLEAN,
  food_id UUID,
  custom_food_id UUID,
  image_url TEXT,
  nutrition_label_url TEXT,
  serving_description TEXT,
  fiber_per_100g NUMERIC,
  sugar_per_100g NUMERIC,
  sodium_per_100g NUMERIC,
  saturated_fat_per_100g NUMERIC,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fl.id,
    COALESCE(cf.name, f.name, 'Unknown')::TEXT AS food_name,
    COALESCE(cf.brand, f.brand)::TEXT AS brand,
    fl.meal_type,
    fl.serving_size_g,
    fl.quantity,
    fl.calories,
    fl.protein,
    fl.carbs,
    fl.fat,
    fl.notes,
    (fl.custom_food_id IS NOT NULL) AS is_custom,
    fl.food_id,
    fl.custom_food_id,
    COALESCE(cf.image_url, f.image_url)::TEXT AS image_url,
    COALESCE(cf.nutrition_label_url, f.nutrition_label_url)::TEXT AS nutrition_label_url,
    COALESCE(cf.serving_description, f.serving_description)::TEXT AS serving_description,
    COALESCE(cf.fiber_per_100g, f.fiber_per_100g) AS fiber_per_100g,
    COALESCE(cf.sugar_per_100g, f.sugar_per_100g) AS sugar_per_100g,
    COALESCE(cf.sodium_per_100g, f.sodium_per_100g) AS sodium_per_100g,
    COALESCE(cf.saturated_fat_per_100g, f.saturated_fat_per_100g) AS saturated_fat_per_100g,
    COALESCE(cf.calories_per_100g, f.calories_per_100g) AS calories_per_100g,
    COALESCE(cf.protein_per_100g, f.protein_per_100g) AS protein_per_100g,
    COALESCE(cf.carbs_per_100g, f.carbs_per_100g) AS carbs_per_100g,
    COALESCE(cf.fat_per_100g, f.fat_per_100g) AS fat_per_100g,
    fl.created_at
  FROM food_logs fl
  LEFT JOIN foods f ON f.id = fl.food_id
  LEFT JOIN custom_foods cf ON cf.id = fl.custom_food_id
  WHERE fl.user_id = auth.uid() AND fl.logged_at = p_date
  ORDER BY
    CASE fl.meal_type
      WHEN 'breakfast' THEN 1
      WHEN 'lunch' THEN 2
      WHEN 'dinner' THEN 3
      WHEN 'snack' THEN 4
      ELSE 5
    END,
    fl.created_at;
END;
$$;
