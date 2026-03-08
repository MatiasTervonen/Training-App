-- Fix habit_get_stats: replace CURRENT_DATE (UTC) with p_date parameter (user's local date)

DROP FUNCTION IF EXISTS habit_get_stats(UUID);
DROP FUNCTION IF EXISTS habit_get_stats(UUID, DATE);

CREATE FUNCTION habit_get_stats(
  p_habit_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total INT;
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_streak INT := 0;
  v_prev_date DATE;
  v_first_date DATE;
  v_total_expected INT;
  v_frequency_days INT[];
  v_check_date DATE;
  rec RECORD;
BEGIN
  -- Get frequency_days for this habit
  SELECT frequency_days INTO v_frequency_days
  FROM habits WHERE id = p_habit_id AND user_id = auth.uid();

  -- Total completions
  SELECT COUNT(*) INTO v_total
  FROM habit_logs WHERE habit_id = p_habit_id AND user_id = auth.uid();

  -- First log date for completion rate
  SELECT MIN(completed_date) INTO v_first_date
  FROM habit_logs WHERE habit_id = p_habit_id AND user_id = auth.uid();

  IF v_first_date IS NULL THEN
    RETURN json_build_object(
      'total', 0, 'current_streak', 0, 'longest_streak', 0, 'completion_rate', 0
    );
  END IF;

  -- Calculate total expected days based on frequency
  IF v_frequency_days IS NULL THEN
    -- Daily: every day counts
    v_total_expected := GREATEST((p_date - v_first_date)::INT + 1, 1);
  ELSE
    -- Specific days: count only matching weekdays
    v_total_expected := 0;
    v_check_date := v_first_date;
    WHILE v_check_date <= p_date LOOP
      IF (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(v_frequency_days) THEN
        v_total_expected := v_total_expected + 1;
      END IF;
      v_check_date := v_check_date + 1;
    END LOOP;
    v_total_expected := GREATEST(v_total_expected, 1);
  END IF;

  -- Calculate streaks by iterating dates in reverse order
  FOR rec IN
    SELECT completed_date FROM habit_logs
    WHERE habit_id = p_habit_id AND user_id = auth.uid()
    ORDER BY completed_date DESC
  LOOP
    IF v_prev_date IS NULL THEN
      v_streak := 1;
      IF rec.completed_date >= p_date - 1 THEN
        v_current_streak := 1;
      END IF;
    ELSE
      -- Count scheduled days between prev_date and current date
      DECLARE
        v_gap_scheduled INT := 0;
        v_gap_date DATE;
      BEGIN
        v_gap_date := rec.completed_date + 1;
        WHILE v_gap_date < v_prev_date LOOP
          IF v_frequency_days IS NULL THEN
            v_gap_scheduled := v_gap_scheduled + 1;
          ELSIF (EXTRACT(DOW FROM v_gap_date)::INT + 1) = ANY(v_frequency_days) THEN
            v_gap_scheduled := v_gap_scheduled + 1;
          END IF;
          v_gap_date := v_gap_date + 1;
        END LOOP;

        IF v_gap_scheduled = 0 THEN
          v_streak := v_streak + 1;
          IF v_current_streak > 0 THEN
            v_current_streak := v_streak;
          END IF;
        ELSE
          IF v_streak > v_longest_streak THEN
            v_longest_streak := v_streak;
          END IF;
          v_streak := 1;
        END IF;
      END;
    END IF;
    v_prev_date := rec.completed_date;
  END LOOP;

  IF v_streak > v_longest_streak THEN
    v_longest_streak := v_streak;
  END IF;

  RETURN json_build_object(
    'total', v_total,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'completion_rate', ROUND((v_total::NUMERIC / v_total_expected) * 100)
  );
END;
$$;
