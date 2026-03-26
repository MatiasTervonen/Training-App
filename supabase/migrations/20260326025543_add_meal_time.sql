-- Add meal_time column to food_logs so users can see/edit when a meal was eaten

---------------------------------------------------------------------
-- 1. ADD COLUMN
---------------------------------------------------------------------
ALTER TABLE food_logs ADD COLUMN meal_time TIME DEFAULT NULL;

---------------------------------------------------------------------
-- 2. UPDATE nutrition_log_food — accept optional p_meal_time
---------------------------------------------------------------------
DROP FUNCTION IF EXISTS nutrition_log_food(UUID, UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, DATE, TEXT);

CREATE FUNCTION nutrition_log_food(
  p_food_id UUID DEFAULT NULL,
  p_custom_food_id UUID DEFAULT NULL,
  p_food_name TEXT DEFAULT 'Food',
  p_meal_type TEXT DEFAULT 'snack',
  p_serving_size_g NUMERIC DEFAULT 100,
  p_quantity NUMERIC DEFAULT 1,
  p_calories NUMERIC DEFAULT 0,
  p_protein NUMERIC DEFAULT 0,
  p_carbs NUMERIC DEFAULT 0,
  p_fat NUMERIC DEFAULT 0,
  p_logged_at DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_meal_time TIME DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_log_id UUID;
  v_total_calories NUMERIC;
  v_total_protein NUMERIC;
  v_total_carbs NUMERIC;
  v_total_fat NUMERIC;
  v_entry_count INT;
  v_calorie_goal NUMERIC;
  v_source_id UUID;
BEGIN
  -- Insert the food log
  INSERT INTO food_logs (food_id, custom_food_id, meal_type, serving_size_g, quantity, calories, protein, carbs, fat, logged_at, notes, meal_time)
  VALUES (p_food_id, p_custom_food_id, p_meal_type, p_serving_size_g, p_quantity, p_calories, p_protein, p_carbs, p_fat, p_logged_at, p_notes, p_meal_time)
  RETURNING id INTO v_log_id;

  -- Aggregate daily totals
  SELECT COALESCE(SUM(calories), 0), COALESCE(SUM(protein), 0), COALESCE(SUM(carbs), 0), COALESCE(SUM(fat), 0), COUNT(*)
  INTO v_total_calories, v_total_protein, v_total_carbs, v_total_fat, v_entry_count
  FROM food_logs
  WHERE user_id = auth.uid() AND logged_at = p_logged_at;

  -- Get calorie goal
  SELECT COALESCE(calorie_goal, 2000) INTO v_calorie_goal
  FROM nutrition_goals
  WHERE user_id = auth.uid();

  IF v_calorie_goal IS NULL THEN
    v_calorie_goal := 2000;
  END IF;

  -- Upsert feed item for this day
  SELECT source_id INTO v_source_id
  FROM feed_items
  WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at;

  IF v_source_id IS NOT NULL THEN
    UPDATE feed_items
    SET extra_fields = jsonb_build_object(
          'total_calories', v_total_calories,
          'total_protein', v_total_protein,
          'total_carbs', v_total_carbs,
          'total_fat', v_total_fat,
          'entry_count', v_entry_count,
          'calorie_goal', v_calorie_goal
        ),
        updated_at = now()
    WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at;
  ELSE
    v_source_id := gen_random_uuid();
    INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
    VALUES (
      p_food_name,
      'nutrition',
      jsonb_build_object(
        'total_calories', v_total_calories,
        'total_protein', v_total_protein,
        'total_carbs', v_total_carbs,
        'total_fat', v_total_fat,
        'entry_count', v_entry_count,
        'calorie_goal', v_calorie_goal
      ),
      v_source_id,
      p_logged_at::timestamptz
    );
  END IF;

  RETURN v_log_id;
END;
$$;

---------------------------------------------------------------------
-- 3. UPDATE nutrition_log_saved_meal — accept optional p_meal_time
---------------------------------------------------------------------
DROP FUNCTION IF EXISTS nutrition_log_saved_meal(UUID, TEXT, DATE);

CREATE FUNCTION nutrition_log_saved_meal(
  p_saved_meal_id UUID,
  p_meal_type TEXT DEFAULT 'snack',
  p_logged_at DATE DEFAULT NULL,
  p_meal_time TIME DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_item RECORD;
  v_calories NUMERIC;
  v_protein NUMERIC;
  v_carbs NUMERIC;
  v_fat NUMERIC;
  v_total_calories NUMERIC;
  v_total_protein NUMERIC;
  v_total_carbs NUMERIC;
  v_total_fat NUMERIC;
  v_entry_count INT;
  v_calorie_goal NUMERIC;
  v_source_id UUID;
  v_first_name TEXT;
BEGIN
  FOR v_item IN
    SELECT smi.*,
           COALESCE(cf.name, f.name, 'Unknown') AS food_name,
           COALESCE(cf.calories_per_100g, f.calories_per_100g, 0) AS cal_100,
           COALESCE(cf.protein_per_100g, f.protein_per_100g, 0) AS pro_100,
           COALESCE(cf.carbs_per_100g, f.carbs_per_100g, 0) AS carb_100,
           COALESCE(cf.fat_per_100g, f.fat_per_100g, 0) AS fat_100
    FROM saved_meal_items smi
    LEFT JOIN foods f ON f.id = smi.food_id
    LEFT JOIN custom_foods cf ON cf.id = smi.custom_food_id
    WHERE smi.saved_meal_id = p_saved_meal_id
    ORDER BY smi.sort_order
  LOOP
    v_calories := (v_item.cal_100 * v_item.serving_size_g * v_item.quantity) / 100;
    v_protein := (v_item.pro_100 * v_item.serving_size_g * v_item.quantity) / 100;
    v_carbs := (v_item.carb_100 * v_item.serving_size_g * v_item.quantity) / 100;
    v_fat := (v_item.fat_100 * v_item.serving_size_g * v_item.quantity) / 100;

    IF v_first_name IS NULL THEN
      v_first_name := v_item.food_name;
    END IF;

    INSERT INTO food_logs (food_id, custom_food_id, meal_type, serving_size_g, quantity, calories, protein, carbs, fat, logged_at, meal_time)
    VALUES (v_item.food_id, v_item.custom_food_id, p_meal_type, v_item.serving_size_g, v_item.quantity, v_calories, v_protein, v_carbs, v_fat, p_logged_at, p_meal_time);
  END LOOP;

  -- Aggregate daily totals for feed
  SELECT COALESCE(SUM(calories), 0), COALESCE(SUM(protein), 0), COALESCE(SUM(carbs), 0), COALESCE(SUM(fat), 0), COUNT(*)
  INTO v_total_calories, v_total_protein, v_total_carbs, v_total_fat, v_entry_count
  FROM food_logs
  WHERE user_id = auth.uid() AND logged_at = p_logged_at;

  SELECT COALESCE(calorie_goal, 2000) INTO v_calorie_goal
  FROM nutrition_goals WHERE user_id = auth.uid();
  IF v_calorie_goal IS NULL THEN v_calorie_goal := 2000; END IF;

  SELECT source_id INTO v_source_id
  FROM feed_items
  WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at;

  IF v_source_id IS NOT NULL THEN
    UPDATE feed_items
    SET extra_fields = jsonb_build_object(
          'total_calories', v_total_calories,
          'total_protein', v_total_protein,
          'total_carbs', v_total_carbs,
          'total_fat', v_total_fat,
          'entry_count', v_entry_count,
          'calorie_goal', v_calorie_goal
        ),
        updated_at = now()
    WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at;
  ELSE
    v_source_id := gen_random_uuid();
    INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
    VALUES (
      COALESCE(v_first_name, 'Meal'),
      'nutrition',
      jsonb_build_object(
        'total_calories', v_total_calories,
        'total_protein', v_total_protein,
        'total_carbs', v_total_carbs,
        'total_fat', v_total_fat,
        'entry_count', v_entry_count,
        'calorie_goal', v_calorie_goal
      ),
      v_source_id,
      p_logged_at::timestamptz
    );
  END IF;
END;
$$;

---------------------------------------------------------------------
-- 4. UPDATE nutrition_get_daily_logs — return meal_time
---------------------------------------------------------------------
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
  created_at TIMESTAMPTZ,
  meal_time TIME
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
    fl.created_at,
    fl.meal_time
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

---------------------------------------------------------------------
-- 5. RPC to update meal_time for all items in a meal group
---------------------------------------------------------------------
CREATE FUNCTION nutrition_update_meal_time(
  p_logged_at DATE,
  p_meal_type TEXT,
  p_meal_time TIME
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  UPDATE food_logs
  SET meal_time = p_meal_time
  WHERE user_id = auth.uid()
    AND logged_at = p_logged_at
    AND meal_type = p_meal_type;
END;
$$;
