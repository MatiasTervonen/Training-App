-- Food data correction: food_reports table, RLS, RPCs, and admin update policy on foods

-- 1a. food_reports table
CREATE TABLE food_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  reported_calories_per_100g NUMERIC(7,2),
  reported_protein_per_100g NUMERIC(7,2),
  reported_carbs_per_100g NUMERIC(7,2),
  reported_fat_per_100g NUMERIC(7,2),
  reported_saturated_fat_per_100g NUMERIC(7,2),
  reported_sugar_per_100g NUMERIC(7,2),
  reported_fiber_per_100g NUMERIC(7,2),
  reported_sodium_per_100g NUMERIC(7,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_food_reports_status ON food_reports (status, created_at DESC);

-- 1b. RLS policies
ALTER TABLE food_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_reports_insert"
  ON food_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "food_reports_admin_select"
  ON food_reports FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'));

CREATE POLICY "food_reports_admin_update"
  ON food_reports FOR UPDATE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'))
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'));

CREATE POLICY "food_reports_admin_delete"
  ON food_reports FOR DELETE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'));

-- 1c. RPC: nutrition_report_food (user-facing)
DROP FUNCTION IF EXISTS nutrition_report_food;
CREATE FUNCTION nutrition_report_food(
  p_food_id UUID,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO food_reports (
    food_id,
    reported_calories_per_100g, reported_protein_per_100g,
    reported_carbs_per_100g, reported_fat_per_100g,
    reported_saturated_fat_per_100g, reported_sugar_per_100g,
    reported_fiber_per_100g, reported_sodium_per_100g
  ) VALUES (
    p_food_id,
    p_calories_per_100g, p_protein_per_100g,
    p_carbs_per_100g, p_fat_per_100g,
    p_saturated_fat_per_100g, p_sugar_per_100g,
    p_fiber_per_100g, p_sodium_per_100g
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 1d. RPC: admin_get_food_reports (admin-facing)
DROP FUNCTION IF EXISTS admin_get_food_reports;
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
  reported_calories_per_100g NUMERIC,
  reported_protein_per_100g NUMERIC,
  reported_carbs_per_100g NUMERIC,
  reported_fat_per_100g NUMERIC,
  reported_saturated_fat_per_100g NUMERIC,
  reported_sugar_per_100g NUMERIC,
  reported_fiber_per_100g NUMERIC,
  reported_sodium_per_100g NUMERIC,
  food_name TEXT,
  brand TEXT,
  barcode TEXT,
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
    r.reported_calories_per_100g, r.reported_protein_per_100g,
    r.reported_carbs_per_100g, r.reported_fat_per_100g,
    r.reported_saturated_fat_per_100g, r.reported_sugar_per_100g,
    r.reported_fiber_per_100g, r.reported_sodium_per_100g,
    f.name AS food_name, f.brand, f.barcode,
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

-- 1e. RPC: admin_resolve_food_report (admin-facing)
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
  p_sodium_per_100g NUMERIC DEFAULT NULL
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

  -- Update report status
  UPDATE food_reports SET status = p_action WHERE id = p_report_id
  RETURNING food_id INTO v_food_id;

  -- If accepted, update the shared foods table
  IF p_action = 'accepted' THEN
    UPDATE foods SET
      calories_per_100g = COALESCE(p_calories_per_100g, calories_per_100g),
      protein_per_100g = COALESCE(p_protein_per_100g, protein_per_100g),
      carbs_per_100g = COALESCE(p_carbs_per_100g, carbs_per_100g),
      fat_per_100g = COALESCE(p_fat_per_100g, fat_per_100g),
      saturated_fat_per_100g = COALESCE(p_saturated_fat_per_100g, saturated_fat_per_100g),
      sugar_per_100g = COALESCE(p_sugar_per_100g, sugar_per_100g),
      fiber_per_100g = COALESCE(p_fiber_per_100g, fiber_per_100g),
      sodium_per_100g = COALESCE(p_sodium_per_100g, sodium_per_100g)
    WHERE id = v_food_id;
  END IF;
END;
$$;

-- 1f. UPDATE policy on foods for admin
CREATE POLICY "foods_update_admin" ON foods FOR UPDATE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'))
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'));
