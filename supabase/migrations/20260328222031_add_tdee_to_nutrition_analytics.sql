-- Add TDEE (Total Daily Energy Expenditure) to nutrition analytics daily totals
-- so the calorie chart can show energy balance comparison per day.

DROP FUNCTION IF EXISTS nutrition_get_analytics;

CREATE FUNCTION nutrition_get_analytics(
  p_start_date DATE,
  p_end_date DATE,
  p_tz TEXT DEFAULT 'UTC'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_daily_totals JSON;
  v_top_foods JSON;
  v_calorie_goal NUMERIC;
  v_bmr NUMERIC;
  v_weight_kg NUMERIC;
  v_height_cm NUMERIC;
  v_birth_date DATE;
  v_gender TEXT;
  v_age_years INTEGER;
BEGIN
  -- Get user's calorie goal
  SELECT COALESCE(ng.calorie_goal, 2000)
  INTO v_calorie_goal
  FROM nutrition_goals ng
  WHERE ng.user_id = auth.uid();

  IF v_calorie_goal IS NULL THEN
    v_calorie_goal := 2000;
  END IF;

  -- Get user profile for BMR
  SELECT height_cm, birth_date, gender
  INTO v_height_cm, v_birth_date, v_gender
  FROM users
  WHERE id = auth.uid();

  -- Get latest weight on or before end date
  SELECT w.weight INTO v_weight_kg
  FROM weight w
  WHERE w.user_id = auth.uid()
    AND (w.created_at AT TIME ZONE p_tz)::date <= p_end_date
  ORDER BY w.created_at DESC
  LIMIT 1;

  IF v_weight_kg IS NULL THEN
    SELECT w.weight INTO v_weight_kg
    FROM weight w
    WHERE w.user_id = auth.uid()
    ORDER BY w.created_at DESC
    LIMIT 1;
  END IF;

  v_weight_kg := COALESCE(v_weight_kg, 70);

  -- Compute age
  IF v_birth_date IS NOT NULL THEN
    v_age_years := EXTRACT(YEAR FROM age(p_end_date, v_birth_date))::INTEGER;
  ELSE
    v_age_years := 30;
  END IF;

  -- BMR (Mifflin-St Jeor)
  IF v_gender = 'male' THEN
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 170)) - (5 * v_age_years) + 5;
  ELSIF v_gender = 'female' THEN
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 160)) - (5 * v_age_years) - 161;
  ELSE
    v_bmr := (10 * v_weight_kg) + (6.25 * COALESCE(v_height_cm, 165)) - (5 * v_age_years) - 78;
  END IF;

  -- Daily totals with TDEE
  WITH food_daily AS (
    SELECT
      fl.logged_at AS day,
      ROUND(SUM(fl.calories)::numeric, 0) AS calories,
      ROUND(SUM(COALESCE(fl.protein, 0))::numeric, 1) AS protein,
      ROUND(SUM(COALESCE(fl.carbs, 0))::numeric, 1) AS carbs,
      ROUND(SUM(COALESCE(fl.fat, 0))::numeric, 1) AS fat,
      COALESCE(SUM(fl.protein), 0) * 4 AS protein_cal,
      COALESCE(SUM(fl.carbs), 0) * 4 AS carbs_cal,
      COALESCE(SUM(fl.fat), 0) * 9 AS fat_cal
    FROM food_logs fl
    WHERE fl.user_id = auth.uid()
      AND fl.logged_at BETWEEN p_start_date AND p_end_date
    GROUP BY fl.logged_at
  ),
  exercise_daily AS (
    SELECT
      (s.start_time AT TIME ZONE p_tz)::date AS day,
      COALESCE(SUM(ss.calories), 0) AS gross_cal,
      COALESCE(SUM(s.duration) / 3600.0, 0) AS hours
    FROM sessions s
    JOIN session_stats ss ON ss.session_id = s.id
    WHERE s.user_id = auth.uid()
      AND (s.start_time AT TIME ZONE p_tz)::date BETWEEN p_start_date AND p_end_date
    GROUP BY 1
  ),
  daily_base AS (
    SELECT
      fd.day,
      v_bmr * (CASE activity_level_get(fd.day)
        WHEN 1 THEN 1.2
        WHEN 2 THEN 1.375
        WHEN 3 THEN 1.55
        WHEN 4 THEN 1.725
        WHEN 5 THEN 1.9
        ELSE 1.2
      END) AS base_burn
    FROM food_daily fd
  )
  SELECT COALESCE(json_agg(row_to_json(result) ORDER BY result.date), '[]'::json)
  INTO v_daily_totals
  FROM (
    SELECT
      fd.day AS date,
      fd.calories,
      fd.protein,
      fd.carbs,
      fd.fat,
      v_calorie_goal AS calorie_goal,
      ROUND(
        db.base_burn
        + GREATEST(
            COALESCE(ed.gross_cal, 0)
            - (db.base_burn / 24.0 * COALESCE(ed.hours, 0)),
            0
          )
        + (fd.protein_cal * 0.25)
        + (fd.carbs_cal * 0.07)
        + (fd.fat_cal * 0.02)
      ) AS tdee
    FROM food_daily fd
    JOIN daily_base db ON db.day = fd.day
    LEFT JOIN exercise_daily ed ON ed.day = fd.day
  ) result;

  -- Top 5 most logged foods (unchanged)
  SELECT COALESCE(json_agg(row_to_json(f) ORDER BY f.log_count DESC), '[]'::json)
  INTO v_top_foods
  FROM (
    SELECT
      COALESCE(fo.name, cf.name, 'Unknown') AS food_name,
      COUNT(*)::int AS log_count,
      ROUND(SUM(fl.calories)::numeric, 0) AS total_calories
    FROM food_logs fl
    LEFT JOIN foods fo ON fo.id = fl.food_id
    LEFT JOIN custom_foods cf ON cf.id = fl.custom_food_id
    WHERE fl.user_id = auth.uid()
      AND fl.logged_at BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(fo.name, cf.name, 'Unknown')
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) f;

  RETURN json_build_object(
    'daily_totals', v_daily_totals,
    'top_foods', v_top_foods
  );
END;
$$;
