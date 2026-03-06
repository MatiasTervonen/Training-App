-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reminder_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit logs (one entry per habit per day)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own habit logs"
  ON habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast date-range queries
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, completed_date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, completed_date);

-- RPC: toggle habit log (atomic check-then-insert/delete)
DROP FUNCTION IF EXISTS habit_toggle_log;
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
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM habit_logs
    WHERE habit_id = p_habit_id AND completed_date = p_date AND user_id = auth.uid();
    RETURN false; -- unchecked
  ELSE
    INSERT INTO habit_logs (habit_id, completed_date)
    VALUES (p_habit_id, p_date);
    RETURN true; -- checked
  END IF;
END;
$$;

-- RPC: get habit stats (streaks, completion rate)
DROP FUNCTION IF EXISTS habit_get_stats;
CREATE FUNCTION habit_get_stats(
  p_habit_id UUID
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
  v_total_days INT;
  rec RECORD;
BEGIN
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

  v_total_days := GREATEST((CURRENT_DATE - v_first_date)::INT + 1, 1);

  -- Calculate streaks by iterating dates in reverse order
  FOR rec IN
    SELECT completed_date FROM habit_logs
    WHERE habit_id = p_habit_id AND user_id = auth.uid()
    ORDER BY completed_date DESC
  LOOP
    IF v_prev_date IS NULL THEN
      -- First iteration
      v_streak := 1;
      -- Current streak only counts if includes today or yesterday
      IF rec.completed_date >= CURRENT_DATE - 1 THEN
        v_current_streak := 1;
      END IF;
    ELSIF v_prev_date - rec.completed_date = 1 THEN
      -- Consecutive day
      v_streak := v_streak + 1;
      IF v_current_streak > 0 THEN
        v_current_streak := v_streak;
      END IF;
    ELSE
      -- Streak broken
      IF v_streak > v_longest_streak THEN
        v_longest_streak := v_streak;
      END IF;
      v_streak := 1;
      -- Current streak is already finalized
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
    'completion_rate', ROUND((v_total::NUMERIC / v_total_days) * 100)
  );
END;
$$;
