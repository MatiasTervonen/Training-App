-- Saved meals: named groups of foods that can be logged at once

---------------------------------------------------------------------
-- 1. TABLES
---------------------------------------------------------------------

CREATE TABLE saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_saved_meals_user ON saved_meals (user_id);

ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_meals_all" ON saved_meals FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE saved_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id UUID NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  custom_food_id UUID REFERENCES custom_foods(id),
  serving_size_g NUMERIC(8,2) NOT NULL DEFAULT 100,
  quantity NUMERIC(6,2) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT saved_meal_items_one_source CHECK (
    (food_id IS NOT NULL AND custom_food_id IS NULL) OR
    (food_id IS NULL AND custom_food_id IS NOT NULL)
  )
);

CREATE INDEX idx_saved_meal_items_meal ON saved_meal_items (saved_meal_id);

ALTER TABLE saved_meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_meal_items_all" ON saved_meal_items FOR ALL TO authenticated
  USING (
    saved_meal_id IN (SELECT id FROM saved_meals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    saved_meal_id IN (SELECT id FROM saved_meals WHERE user_id = auth.uid())
  );

---------------------------------------------------------------------
-- 2. RPC FUNCTIONS
---------------------------------------------------------------------

-- Save (create or update) a meal with its items
CREATE FUNCTION nutrition_save_meal(
  p_meal_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT 'My Meal',
  p_items JSONB DEFAULT '[]'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_meal_id UUID;
  v_item JSONB;
BEGIN
  IF p_meal_id IS NOT NULL THEN
    UPDATE saved_meals SET name = p_name, updated_at = now()
    WHERE id = p_meal_id AND user_id = auth.uid();
    v_meal_id := p_meal_id;
    DELETE FROM saved_meal_items WHERE saved_meal_id = v_meal_id;
  ELSE
    INSERT INTO saved_meals (name) VALUES (p_name)
    RETURNING id INTO v_meal_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO saved_meal_items (saved_meal_id, food_id, custom_food_id, serving_size_g, quantity, sort_order)
    VALUES (
      v_meal_id,
      (v_item->>'food_id')::UUID,
      (v_item->>'custom_food_id')::UUID,
      COALESCE((v_item->>'serving_size_g')::NUMERIC, 100),
      COALESCE((v_item->>'quantity')::NUMERIC, 1),
      COALESCE((v_item->>'sort_order')::INT, 0)
    );
  END LOOP;

  RETURN v_meal_id;
END;
$$;

-- Get all saved meals with items and food details
CREATE FUNCTION nutrition_get_saved_meals()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  items JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.name,
    sm.created_at,
    sm.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', smi.id,
          'food_id', smi.food_id,
          'custom_food_id', smi.custom_food_id,
          'serving_size_g', smi.serving_size_g,
          'quantity', smi.quantity,
          'sort_order', smi.sort_order,
          'food_name', COALESCE(cf.name, f.name, 'Unknown'),
          'brand', COALESCE(cf.brand, f.brand),
          'calories_per_100g', COALESCE(cf.calories_per_100g, f.calories_per_100g, 0),
          'protein_per_100g', COALESCE(cf.protein_per_100g, f.protein_per_100g, 0),
          'carbs_per_100g', COALESCE(cf.carbs_per_100g, f.carbs_per_100g, 0),
          'fat_per_100g', COALESCE(cf.fat_per_100g, f.fat_per_100g, 0),
          'is_custom', (smi.custom_food_id IS NOT NULL),
          'image_url', COALESCE(cf.image_url, f.image_url)
        ) ORDER BY smi.sort_order
      ) FILTER (WHERE smi.id IS NOT NULL),
      '[]'::JSONB
    ) AS items
  FROM saved_meals sm
  LEFT JOIN saved_meal_items smi ON smi.saved_meal_id = sm.id
  LEFT JOIN foods f ON f.id = smi.food_id
  LEFT JOIN custom_foods cf ON cf.id = smi.custom_food_id
  WHERE sm.user_id = auth.uid()
  GROUP BY sm.id, sm.name, sm.created_at, sm.updated_at
  ORDER BY sm.updated_at DESC NULLS LAST, sm.created_at DESC;
END;
$$;

-- Delete a saved meal (items cascade)
CREATE FUNCTION nutrition_delete_saved_meal(p_meal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  DELETE FROM saved_meals WHERE id = p_meal_id AND user_id = auth.uid();
END;
$$;

-- Log all items from a saved meal at once
CREATE FUNCTION nutrition_log_saved_meal(
  p_saved_meal_id UUID,
  p_meal_type TEXT DEFAULT 'snack',
  p_logged_at DATE DEFAULT NULL
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

    INSERT INTO food_logs (food_id, custom_food_id, meal_type, serving_size_g, quantity, calories, protein, carbs, fat, logged_at)
    VALUES (v_item.food_id, v_item.custom_food_id, p_meal_type, v_item.serving_size_g, v_item.quantity, v_calories, v_protein, v_carbs, v_fat, p_logged_at);
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
