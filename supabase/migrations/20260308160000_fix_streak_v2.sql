-- Fix habit_toggle_log: previous migration accidentally reverted timezone fix
-- (used CURRENT_DATE instead of p_date). Restore p_date usage AND add
-- created_at filter so new habits don't count against past days.

DROP FUNCTION IF EXISTS habit_toggle_log(UUID, DATE);
CREATE FUNCTION habit_toggle_log(
  p_habit_id UUID,
  p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_checked BOOLEAN;
  v_completed INT;
  v_total INT;
  v_current_streak INT := 0;
  v_check_date DATE;
  v_day_total INT;
  v_day_completed INT;
  v_source_id UUID;
BEGIN
  -- 1. Toggle the habit log
  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = auth.uid();
    v_checked := false;
  ELSE
    INSERT INTO habit_logs (habit_id, completed_date)
    VALUES (p_habit_id, p_date);
    v_checked := true;
  END IF;

  -- 2. Count completed / total active habits for p_date (NOT CURRENT_DATE — timezone fix)
  SELECT COUNT(*) INTO v_total
  FROM habits
  WHERE user_id = auth.uid() AND is_active = true
    AND (frequency_days IS NULL OR (EXTRACT(DOW FROM p_date)::INT + 1) = ANY(frequency_days));

  SELECT COUNT(DISTINCT hl.habit_id) INTO v_completed
  FROM habit_logs hl
  JOIN habits h ON h.id = hl.habit_id
  WHERE hl.user_id = auth.uid()
    AND hl.completed_date = p_date
    AND h.is_active = true
    AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM p_date)::INT + 1) = ANY(h.frequency_days));

  -- 3. Calculate current streak
  IF v_total > 0 AND v_completed >= v_total THEN
    v_current_streak := 1;
    v_check_date := p_date - 1;
  ELSE
    v_check_date := p_date - 1;
  END IF;

  WHILE v_check_date >= p_date - 365 LOOP
    -- Only count habits that existed on the check date
    SELECT COUNT(*) INTO v_day_total
    FROM habits
    WHERE user_id = auth.uid() AND is_active = true
      AND created_at::date <= v_check_date
      AND (frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(frequency_days));

    IF v_day_total = 0 THEN
      v_check_date := v_check_date - 1;
      CONTINUE;
    END IF;

    SELECT COUNT(DISTINCT hl.habit_id) INTO v_day_completed
    FROM habit_logs hl
    JOIN habits h ON h.id = hl.habit_id
    WHERE hl.user_id = auth.uid()
      AND hl.completed_date = v_check_date
      AND h.is_active = true
      AND h.created_at::date <= v_check_date
      AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(h.frequency_days));

    IF v_day_completed >= v_day_total THEN
      v_current_streak := v_current_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 4. Upsert feed item for p_date
  IF v_total > 0 THEN
    SELECT source_id INTO v_source_id
    FROM feed_items
    WHERE type = 'habits'
      AND user_id = auth.uid()
      AND occurred_at::date = p_date;

    IF v_source_id IS NOT NULL THEN
      UPDATE feed_items
      SET extra_fields = jsonb_build_object(
            'completed', v_completed,
            'total', v_total,
            'current_streak', v_current_streak
          ),
          updated_at = now()
      WHERE type = 'habits'
        AND user_id = auth.uid()
        AND occurred_at::date = p_date;
    ELSE
      v_source_id := gen_random_uuid();
      INSERT INTO feed_items (title, type, extra_fields, source_id, occurred_at)
      VALUES (
        'Habits',
        'habits',
        jsonb_build_object(
          'completed', v_completed,
          'total', v_total,
          'current_streak', v_current_streak
        ),
        v_source_id,
        p_date::timestamptz
      );
    END IF;
  END IF;

  RETURN v_checked;
END;
$$;
