-- Nutrition tracking: tables, RPC functions, and feed integration

---------------------------------------------------------------------
-- 1. TABLES
---------------------------------------------------------------------

-- Shared food cache (populated from Open Food Facts or manual entry)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size_g NUMERIC(8,2) DEFAULT 100,
  serving_description TEXT,
  calories_per_100g NUMERIC(7,2),
  protein_per_100g NUMERIC(7,2),
  carbs_per_100g NUMERIC(7,2),
  fat_per_100g NUMERIC(7,2),
  fiber_per_100g NUMERIC(7,2),
  sugar_per_100g NUMERIC(7,2),
  sodium_per_100g NUMERIC(7,2),
  saturated_fat_per_100g NUMERIC(7,2),
  source TEXT DEFAULT 'openfoodfacts',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_foods_barcode ON foods (barcode) WHERE barcode IS NOT NULL;

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_select" ON foods FOR SELECT TO authenticated USING (true);
CREATE POLICY "foods_insert" ON foods FOR INSERT TO authenticated WITH CHECK (true);

-- User-private custom foods
CREATE TABLE custom_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size_g NUMERIC(8,2) DEFAULT 100,
  serving_description TEXT,
  calories_per_100g NUMERIC(7,2),
  protein_per_100g NUMERIC(7,2),
  carbs_per_100g NUMERIC(7,2),
  fat_per_100g NUMERIC(7,2),
  fiber_per_100g NUMERIC(7,2),
  sugar_per_100g NUMERIC(7,2),
  sodium_per_100g NUMERIC(7,2),
  saturated_fat_per_100g NUMERIC(7,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_foods_all" ON custom_foods FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily food log entries (denormalized nutrition at log time)
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  custom_food_id UUID REFERENCES custom_foods(id),
  meal_type TEXT NOT NULL DEFAULT 'snack',
  serving_size_g NUMERIC(8,2) NOT NULL,
  quantity NUMERIC(6,2) NOT NULL DEFAULT 1,
  calories NUMERIC(7,2) NOT NULL,
  protein NUMERIC(7,2),
  carbs NUMERIC(7,2),
  fat NUMERIC(7,2),
  logged_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT food_logs_one_source CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL)
  )
);

CREATE INDEX idx_food_logs_user_date ON food_logs (user_id, logged_at DESC);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_logs_all" ON food_logs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User nutrition goals
CREATE TABLE nutrition_goals (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_goal NUMERIC(7,0) DEFAULT 2000,
  protein_goal NUMERIC(7,1),
  carbs_goal NUMERIC(7,1),
  fat_goal NUMERIC(7,1),
  custom_meal_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_goals_all" ON nutrition_goals FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Favorite foods junction table
CREATE TABLE favorite_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  custom_food_id UUID REFERENCES custom_foods(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT favorite_foods_one_source CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_favorite_foods_food ON favorite_foods (user_id, food_id) WHERE food_id IS NOT NULL;
CREATE UNIQUE INDEX idx_favorite_foods_custom ON favorite_foods (user_id, custom_food_id) WHERE custom_food_id IS NOT NULL;

ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorite_foods_all" ON favorite_foods FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

---------------------------------------------------------------------
-- 2. RPC FUNCTIONS
---------------------------------------------------------------------

-- Log a food entry and upsert the daily feed item
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
  p_notes TEXT DEFAULT NULL
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
  INSERT INTO food_logs (food_id, custom_food_id, meal_type, serving_size_g, quantity, calories, protein, carbs, fat, logged_at, notes)
  VALUES (p_food_id, p_custom_food_id, p_meal_type, p_serving_size_g, p_quantity, p_calories, p_protein, p_carbs, p_fat, p_logged_at, p_notes)
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

-- Delete a food log entry and refresh the daily feed item
CREATE FUNCTION nutrition_delete_food_log(
  p_log_id UUID,
  p_logged_at DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_total_calories NUMERIC;
  v_total_protein NUMERIC;
  v_total_carbs NUMERIC;
  v_total_fat NUMERIC;
  v_entry_count INT;
  v_calorie_goal NUMERIC;
BEGIN
  -- Delete the log entry
  DELETE FROM food_logs WHERE id = p_log_id AND user_id = auth.uid();

  -- Re-aggregate daily totals
  SELECT COALESCE(SUM(calories), 0), COALESCE(SUM(protein), 0), COALESCE(SUM(carbs), 0), COALESCE(SUM(fat), 0), COUNT(*)
  INTO v_total_calories, v_total_protein, v_total_carbs, v_total_fat, v_entry_count
  FROM food_logs
  WHERE user_id = auth.uid() AND logged_at = p_logged_at;

  IF v_entry_count = 0 THEN
    -- No logs remain: delete feed item
    DELETE FROM pinned_items
    WHERE feed_item_id IN (
      SELECT id FROM feed_items
      WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at
    );
    DELETE FROM feed_items
    WHERE type = 'nutrition' AND user_id = auth.uid() AND occurred_at::date = p_logged_at;
  ELSE
    -- Get calorie goal
    SELECT COALESCE(calorie_goal, 2000) INTO v_calorie_goal
    FROM nutrition_goals WHERE user_id = auth.uid();
    IF v_calorie_goal IS NULL THEN v_calorie_goal := 2000; END IF;

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
  END IF;
END;
$$;

-- Get all food logs for a date with food details
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

-- Cache a food from Open Food Facts into the shared foods table
CREATE FUNCTION nutrition_upsert_food_from_barcode(
  p_barcode TEXT,
  p_name TEXT,
  p_brand TEXT DEFAULT NULL,
  p_serving_description TEXT DEFAULT NULL,
  p_serving_size_g NUMERIC DEFAULT 100,
  p_calories_per_100g NUMERIC DEFAULT 0,
  p_protein_per_100g NUMERIC DEFAULT 0,
  p_carbs_per_100g NUMERIC DEFAULT 0,
  p_fat_per_100g NUMERIC DEFAULT 0,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_food_id UUID;
BEGIN
  INSERT INTO foods (barcode, name, brand, serving_description, serving_size_g,
    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
    fiber_per_100g, sugar_per_100g, sodium_per_100g, saturated_fat_per_100g, image_url, source)
  VALUES (p_barcode, p_name, p_brand, p_serving_description, p_serving_size_g,
    p_calories_per_100g, p_protein_per_100g, p_carbs_per_100g, p_fat_per_100g,
    p_fiber_per_100g, p_sugar_per_100g, p_sodium_per_100g, p_saturated_fat_per_100g, p_image_url, 'openfoodfacts')
  ON CONFLICT (barcode) DO NOTHING
  RETURNING id INTO v_food_id;

  -- If conflict (another user inserted first), get the existing id
  IF v_food_id IS NULL THEN
    SELECT id INTO v_food_id FROM foods WHERE barcode = p_barcode;
  END IF;

  RETURN v_food_id;
END;
$$;

---------------------------------------------------------------------
-- 3. UPDATE feed_delete_session to handle nutrition type
---------------------------------------------------------------------

DROP FUNCTION IF EXISTS feed_delete_session(UUID, TEXT);

CREATE FUNCTION feed_delete_session(p_id UUID, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_nutrition_date DATE;
BEGIN
  IF p_type NOT IN (
    'notes',
    'weight',
    'gym_sessions',
    'todo_lists',
    'global_reminders',
    'local_reminders',
    'activity_sessions',
    'habits',
    'reports',
    'tutorial',
    'nutrition'
  ) THEN
    RAISE EXCEPTION 'invalid feed type: %', p_type;
  END IF;

  -- For nutrition, capture the date before deleting feed item
  IF p_type = 'nutrition' THEN
    SELECT occurred_at::date INTO v_nutrition_date
    FROM feed_items
    WHERE source_id = p_id AND type = 'nutrition'
    LIMIT 1;
  END IF;

  -- Delete pinned items referencing this feed item
  DELETE FROM pinned_items
  WHERE feed_item_id IN (
    SELECT id FROM feed_items
    WHERE source_id = p_id AND type = p_type
  );

  -- Delete the feed item
  DELETE FROM feed_items
  WHERE source_id = p_id AND type = p_type;

  -- Delete domain row
  IF p_type = 'nutrition' THEN
    IF v_nutrition_date IS NOT NULL THEN
      DELETE FROM food_logs
      WHERE user_id = auth.uid() AND logged_at = v_nutrition_date;
    END IF;
  ELSIF p_type IN ('habits', 'reports', 'tutorial') THEN
    IF p_type = 'reports' THEN
      DELETE FROM generated_reports WHERE id = p_id;
    END IF;
  ELSIF p_type IN ('gym_sessions', 'activity_sessions') THEN
    DELETE FROM sessions WHERE id = p_id;
  ELSE
    EXECUTE format('DELETE FROM %I WHERE id = $1', p_type) USING p_id;
  END IF;
END;
$$;
