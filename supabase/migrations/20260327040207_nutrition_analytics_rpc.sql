-- Nutrition analytics RPC: returns daily totals + top foods for a date range
DROP FUNCTION IF EXISTS nutrition_get_analytics;

CREATE FUNCTION nutrition_get_analytics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_daily_totals JSON;
  v_top_foods JSON;
  v_calorie_goal NUMERIC;
BEGIN
  -- Get user's calorie goal
  SELECT COALESCE(ng.calorie_goal, 2000)
  INTO v_calorie_goal
  FROM nutrition_goals ng
  WHERE ng.user_id = auth.uid();

  IF v_calorie_goal IS NULL THEN
    v_calorie_goal := 2000;
  END IF;

  -- Aggregate daily totals
  SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.date), '[]'::json)
  INTO v_daily_totals
  FROM (
    SELECT
      fl.logged_at AS date,
      ROUND(SUM(fl.calories)::numeric, 0) AS calories,
      ROUND(SUM(COALESCE(fl.protein, 0))::numeric, 1) AS protein,
      ROUND(SUM(COALESCE(fl.carbs, 0))::numeric, 1) AS carbs,
      ROUND(SUM(COALESCE(fl.fat, 0))::numeric, 1) AS fat,
      v_calorie_goal AS calorie_goal
    FROM food_logs fl
    WHERE fl.user_id = auth.uid()
      AND fl.logged_at BETWEEN p_start_date AND p_end_date
    GROUP BY fl.logged_at
  ) d;

  -- Top 5 most logged foods
  SELECT COALESCE(json_agg(row_to_json(f) ORDER BY f.log_count DESC), '[]'::json)
  INTO v_top_foods
  FROM (
    SELECT
      fl.food_name,
      COUNT(*)::int AS log_count,
      ROUND(SUM(fl.calories)::numeric, 0) AS total_calories
    FROM food_logs fl
    WHERE fl.user_id = auth.uid()
      AND fl.logged_at BETWEEN p_start_date AND p_end_date
    GROUP BY fl.food_name
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) f;

  RETURN json_build_object(
    'daily_totals', v_daily_totals,
    'top_foods', v_top_foods
  );
END;
$$;
