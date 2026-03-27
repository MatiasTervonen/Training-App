-- Update energy balance RPC:
-- - Replace step-based NEAT with activity level multiplier
-- - TDEE = BMR × multiplier + net_exercise + TEF
-- - Steps removed from calculation entirely

DROP FUNCTION IF EXISTS energy_balance_get_daily;

CREATE FUNCTION energy_balance_get_daily(
  p_date DATE,
  p_tz TEXT DEFAULT 'UTC'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_height_cm NUMERIC;
  v_birth_date DATE;
  v_gender TEXT;
  v_weight_kg NUMERIC;
  v_age_years INTEGER;
  v_bmr NUMERIC;
  v_activity_level SMALLINT;
  v_activity_multiplier NUMERIC;
  v_base_burn NUMERIC;
  v_calories_consumed NUMERIC;
  v_gross_exercise_calories NUMERIC;
  v_total_session_hours NUMERIC;
  v_net_exercise_calories NUMERIC;
  v_protein_cal NUMERIC;
  v_carbs_cal NUMERIC;
  v_fat_cal NUMERIC;
  v_tef NUMERIC;
  v_tdee NUMERIC;
  v_balance NUMERIC;
  v_has_profile BOOLEAN;
BEGIN
  -- 1. Get user profile
  SELECT height_cm, birth_date, gender
  INTO v_height_cm, v_birth_date, v_gender
  FROM users
  WHERE id = auth.uid();

  v_has_profile := (v_birth_date IS NOT NULL AND v_gender IS NOT NULL);

  -- 2. Get latest weight on or before p_date (convert created_at to local date)
  SELECT w.weight INTO v_weight_kg
  FROM weight w
  WHERE w.user_id = auth.uid()
    AND (w.created_at AT TIME ZONE p_tz)::date <= p_date
  ORDER BY w.created_at DESC
  LIMIT 1;

  -- Fallback: try any weight entry if none before p_date
  IF v_weight_kg IS NULL THEN
    SELECT w.weight INTO v_weight_kg
    FROM weight w
    WHERE w.user_id = auth.uid()
    ORDER BY w.created_at DESC
    LIMIT 1;
  END IF;

  v_weight_kg := COALESCE(v_weight_kg, 70);

  -- 3. Compute age (fallback 30)
  IF v_birth_date IS NOT NULL THEN
    v_age_years := EXTRACT(YEAR FROM age(p_date, v_birth_date))::INTEGER;
  ELSE
    v_age_years := 30;
  END IF;

  -- 4. BMR (Mifflin-St Jeor)
  IF v_gender = 'male' THEN
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 170)) - (5 * v_age_years) + 5;
  ELSIF v_gender = 'female' THEN
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 160)) - (5 * v_age_years) - 161;
  ELSE
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 165)) - (5 * v_age_years) - 78;
  END IF;

  -- 5. Activity level multiplier
  v_activity_level := activity_level_get(p_date);

  v_activity_multiplier := CASE v_activity_level
    WHEN 1 THEN 1.2
    WHEN 2 THEN 1.375
    WHEN 3 THEN 1.55
    WHEN 4 THEN 1.725
    WHEN 5 THEN 1.9
    ELSE 1.2
  END;

  -- Base daily burn = BMR × activity multiplier (includes lifestyle NEAT)
  v_base_burn := v_bmr * v_activity_multiplier;

  -- 6. Calories and macros consumed from food_logs for p_date
  SELECT
    COALESCE(SUM(fl.calories), 0),
    COALESCE(SUM(fl.protein), 0) * 4,
    COALESCE(SUM(fl.carbs), 0) * 4,
    COALESCE(SUM(fl.fat), 0) * 9
  INTO v_calories_consumed, v_protein_cal, v_carbs_cal, v_fat_cal
  FROM food_logs fl
  WHERE fl.user_id = auth.uid()
    AND fl.logged_at = p_date;

  -- 7. GROSS exercise calories + total session hours from sessions on this date
  SELECT
    COALESCE(SUM(ss.calories), 0),
    COALESCE(SUM(s.duration) / 3600.0, 0)
  INTO v_gross_exercise_calories, v_total_session_hours
  FROM sessions s
  JOIN session_stats ss ON ss.session_id = s.id
  WHERE s.user_id = auth.uid()
    AND (s.start_time AT TIME ZONE p_tz)::date = p_date;

  -- 8. Convert gross to NET exercise calories
  -- Subtract the base burn portion during exercise time (already counted in base_burn)
  v_net_exercise_calories := GREATEST(
    v_gross_exercise_calories - (v_base_burn / 24.0 * v_total_session_hours),
    0
  );

  -- 9. TEF (thermic effect of food) per-macro
  v_tef := (v_protein_cal * 0.25) + (v_carbs_cal * 0.07) + (v_fat_cal * 0.02);

  -- 10. TDEE = base burn + net exercise + TEF
  v_tdee := v_base_burn + v_net_exercise_calories + v_tef;

  -- 11. Balance
  v_balance := v_calories_consumed - v_tdee;

  RETURN json_build_object(
    'calories_consumed', ROUND(v_calories_consumed),
    'bmr', ROUND(v_bmr),
    'activity_level', v_activity_level,
    'base_burn', ROUND(v_base_burn),
    'net_exercise_calories', ROUND(v_net_exercise_calories),
    'gross_exercise_calories', ROUND(v_gross_exercise_calories),
    'tef', ROUND(v_tef),
    'tdee', ROUND(v_tdee),
    'balance', ROUND(v_balance),
    'weight_kg', ROUND(v_weight_kg, 1),
    'has_profile', v_has_profile
  );
END;
$$;
