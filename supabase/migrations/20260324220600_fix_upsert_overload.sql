-- Fix: duplicate function overloads. Drop all versions and recreate.

DROP FUNCTION IF EXISTS nutrition_upsert_food_from_barcode(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS nutrition_upsert_food_from_barcode(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS nutrition_upsert_food_from_barcode(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT);

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
  p_image_url TEXT DEFAULT NULL,
  p_nutrition_label_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  v_food_id UUID;
BEGIN
  SELECT id INTO v_food_id FROM foods WHERE barcode = p_barcode;

  IF v_food_id IS NOT NULL THEN
    RETURN v_food_id;
  END IF;

  INSERT INTO foods (barcode, name, brand, serving_description, serving_size_g,
    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
    fiber_per_100g, sugar_per_100g, sodium_per_100g, saturated_fat_per_100g,
    image_url, nutrition_label_url, source)
  VALUES (p_barcode, p_name, p_brand, p_serving_description, p_serving_size_g,
    p_calories_per_100g, p_protein_per_100g, p_carbs_per_100g, p_fat_per_100g,
    p_fiber_per_100g, p_sugar_per_100g, p_sodium_per_100g, p_saturated_fat_per_100g,
    p_image_url, p_nutrition_label_url, 'openfoodfacts')
  RETURNING id INTO v_food_id;

  RETURN v_food_id;
END;
$$;
