-- Fix: duration habits were counted as "done" on the feed card
-- even when accumulated_seconds < target_value (partial timer progress).
-- Only count duration habits as completed when the target is actually met.
-- Steps and manual habits remain toggle-based (no accumulated_seconds tracking).

DROP FUNCTION IF EXISTS habit_toggle_log(UUID, DATE, TEXT);
CREATE FUNCTION habit_toggle_log(
  p_habit_id UUID,
  p_date DATE,
  p_tz TEXT DEFAULT 'UTC'
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

  -- 2. Count completed / total for p_date
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
    AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM p_date)::INT + 1) = ANY(h.frequency_days))
    AND (
      h.type IN ('manual', 'steps')
      OR (h.type = 'duration' AND COALESCE(hl.accumulated_seconds, 0) >= h.target_value)
    );

  -- 3. Calculate current streak — only if today is all done
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
        AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(h.frequency_days))
        AND (
          h.type = 'manual'
          OR (h.type IN ('steps', 'duration') AND COALESCE(hl.accumulated_seconds, 0) >= h.target_value)
        );

      IF v_day_completed >= v_day_total THEN
        v_current_streak := v_current_streak + 1;
        v_check_date := v_check_date - 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

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
    AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM p_date)::INT + 1) = ANY(h.frequency_days))
    AND (
      h.type IN ('manual', 'steps')
      OR (h.type = 'duration' AND COALESCE(hl.accumulated_seconds, 0) >= h.target_value)
    );

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
        AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(h.frequency_days))
        AND (
          h.type = 'manual'
          OR (h.type IN ('steps', 'duration') AND COALESCE(hl.accumulated_seconds, 0) >= h.target_value)
        );

      IF v_day_completed >= v_day_total THEN
        v_current_streak := v_current_streak + 1;
        v_check_date := v_check_date - 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  SELECT source_id INTO v_source_id
  FROM feed_items
  WHERE type = 'habits'
    AND user_id = auth.uid()
    AND occurred_at::date = p_date;

  IF v_source_id IS NOT NULL THEN
    IF v_total = 0 THEN
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
