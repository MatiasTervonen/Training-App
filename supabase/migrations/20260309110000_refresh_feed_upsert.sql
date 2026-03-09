-- Fix refresh_habit_feed: create feed item if it doesn't exist yet.
-- Previously it only updated existing feed items, so markHabitDone
-- (from notifications or step auto-complete) wouldn't create the card.

DROP FUNCTION IF EXISTS refresh_habit_feed(DATE, TEXT);
CREATE FUNCTION refresh_habit_feed(p_date DATE, p_tz TEXT DEFAULT 'UTC')
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

  -- Only calculate streak if today is all done
  IF v_total > 0 AND v_completed >= v_total THEN
    v_current_streak := 1;
    v_check_date := p_date - 1;

    WHILE v_check_date >= p_date - 365 LOOP
      SELECT COUNT(*) INTO v_day_total
      FROM habits
      WHERE user_id = auth.uid() AND is_active = true
        AND (created_at AT TIME ZONE p_tz)::date <= v_check_date
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
        AND (h.created_at AT TIME ZONE p_tz)::date <= v_check_date
        AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(h.frequency_days));

      IF v_day_completed >= v_day_total THEN
        v_current_streak := v_current_streak + 1;
        v_check_date := v_check_date - 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Find existing feed item for this date
  SELECT source_id INTO v_source_id
  FROM feed_items
  WHERE type = 'habits'
    AND user_id = auth.uid()
    AND occurred_at::date = p_date;

  IF v_total = 0 THEN
    -- No active habits — delete feed item if it exists
    IF v_source_id IS NOT NULL THEN
      DELETE FROM pinned_items
      WHERE feed_item_id IN (
        SELECT id FROM feed_items
        WHERE source_id = v_source_id AND type = 'habits'
      );
      DELETE FROM feed_items
      WHERE source_id = v_source_id AND type = 'habits';
    END IF;
  ELSIF v_source_id IS NOT NULL THEN
    -- Update existing feed item
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
    -- Create new feed item
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
END;
$$;
