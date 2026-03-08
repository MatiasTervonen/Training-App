-- Refresh the habit feed item when a habit is deleted or archived.
-- Reuses the same total/completed/streak logic from habit_toggle_log.

DROP FUNCTION IF EXISTS refresh_habit_feed(DATE);
CREATE FUNCTION refresh_habit_feed(p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_completed INT;
  v_total INT;
  v_current_streak INT := 0;
  v_check_date DATE;
  v_day_total INT;
  v_day_completed INT;
  v_source_id UUID;
BEGIN
  -- 1. Count completed / total active habits for p_date
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

  -- 2. Calculate current streak
  IF v_total > 0 AND v_completed >= v_total THEN
    v_current_streak := 1;
    v_check_date := p_date - 1;
  ELSE
    v_check_date := p_date - 1;
  END IF;

  WHILE v_check_date >= p_date - 365 LOOP
    SELECT COUNT(*) INTO v_day_total
    FROM habits
    WHERE user_id = auth.uid() AND is_active = true
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
      AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(h.frequency_days));

    IF v_day_completed >= v_day_total THEN
      v_current_streak := v_current_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 3. Find existing feed item for this date
  SELECT source_id INTO v_source_id
  FROM feed_items
  WHERE type = 'habits'
    AND user_id = auth.uid()
    AND occurred_at::date = p_date;

  -- 4. Update, delete, or do nothing
  IF v_source_id IS NOT NULL THEN
    IF v_total = 0 THEN
      -- No active habits left for this day — remove the feed item
      DELETE FROM pinned_items
      WHERE feed_item_id IN (
        SELECT id FROM feed_items
        WHERE source_id = v_source_id AND type = 'habits'
      );
      DELETE FROM feed_items
      WHERE source_id = v_source_id AND type = 'habits';
    ELSE
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
    END IF;
  END IF;
END;
$$;
