-- Extend habit_toggle_log to upsert a daily feed item after toggling
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
  -- 1. Toggle the habit log (existing behavior)
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

  -- 2. Count today's completed / total active habits (scheduled for today)
  SELECT COUNT(*) INTO v_total
  FROM habits
  WHERE user_id = auth.uid() AND is_active = true
    AND (frequency_days IS NULL OR (EXTRACT(DOW FROM CURRENT_DATE)::INT + 1) = ANY(frequency_days));

  SELECT COUNT(DISTINCT hl.habit_id) INTO v_completed
  FROM habit_logs hl
  JOIN habits h ON h.id = hl.habit_id
  WHERE hl.user_id = auth.uid()
    AND hl.completed_date = CURRENT_DATE
    AND h.is_active = true
    AND (h.frequency_days IS NULL OR (EXTRACT(DOW FROM CURRENT_DATE)::INT + 1) = ANY(h.frequency_days));

  -- 3. Calculate current streak (consecutive days with all scheduled habits completed)
  IF v_total > 0 AND v_completed >= v_total THEN
    -- Today counts
    v_current_streak := 1;
    v_check_date := CURRENT_DATE - 1;
  ELSE
    -- Start from yesterday
    v_check_date := CURRENT_DATE - 1;
  END IF;

  -- Walk backwards
  WHILE v_check_date >= CURRENT_DATE - 365 LOOP
    SELECT COUNT(*) INTO v_day_total
    FROM habits
    WHERE user_id = auth.uid() AND is_active = true
      AND (frequency_days IS NULL OR (EXTRACT(DOW FROM v_check_date)::INT + 1) = ANY(frequency_days));

    IF v_day_total = 0 THEN
      -- No habits scheduled this day, skip
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

  -- 4. Upsert feed item for today (only if there are active habits)
  IF v_total > 0 THEN
    -- Try to find existing feed item for today
    SELECT source_id INTO v_source_id
    FROM feed_items
    WHERE type = 'habits'
      AND user_id = auth.uid()
      AND occurred_at::date = CURRENT_DATE;

    IF v_source_id IS NOT NULL THEN
      -- Update existing
      UPDATE feed_items
      SET extra_fields = jsonb_build_object(
            'completed', v_completed,
            'total', v_total,
            'current_streak', v_current_streak
          ),
          updated_at = now()
      WHERE type = 'habits'
        AND user_id = auth.uid()
        AND occurred_at::date = CURRENT_DATE;
    ELSE
      -- Insert new
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
        CURRENT_DATE::timestamptz
      );
    END IF;
  END IF;

  RETURN v_checked;
END;
$$;

-- Update feed_delete_session to support 'habits' type
-- Habits feed items have no domain row — only delete the feed_item and pinned_items
DROP FUNCTION IF EXISTS feed_delete_session(UUID, TEXT);
CREATE FUNCTION feed_delete_session(p_id UUID, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
BEGIN
  IF p_type NOT IN (
    'notes',
    'weight',
    'gym_sessions',
    'todo_lists',
    'global_reminders',
    'local_reminders',
    'activity_sessions',
    'habits'
  ) THEN
    RAISE EXCEPTION 'invalid feed type: %', p_type;
  END IF;

  -- Delete pinned items referencing this feed item
  DELETE FROM pinned_items
  WHERE feed_item_id IN (
    SELECT id FROM feed_items
    WHERE source_id = p_id AND type = p_type
  );

  -- Delete the feed item
  DELETE FROM feed_items
  WHERE source_id = p_id AND type = p_type;

  -- Delete domain row (habits have no domain row to delete)
  IF p_type = 'habits' THEN
    NULL; -- no domain row
  ELSIF p_type IN ('gym_sessions', 'activity_sessions') THEN
    DELETE FROM sessions WHERE id = p_id;
  ELSE
    EXECUTE format('DELETE FROM %I WHERE id = $1', p_type) USING p_id;
  END IF;
END;
$$;
