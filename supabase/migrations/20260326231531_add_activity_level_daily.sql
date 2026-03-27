-- Daily activity level for energy balance calculation
-- Users pick 1-5 each day; replaces step-based NEAT in TDEE

CREATE TABLE activity_level_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE activity_level_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own activity levels"
  ON activity_level_daily FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Upsert activity level for a given date
DROP FUNCTION IF EXISTS activity_level_upsert;

CREATE FUNCTION activity_level_upsert(
  p_date DATE,
  p_level SMALLINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO activity_level_daily (day, level)
  VALUES (p_date, p_level)
  ON CONFLICT (user_id, day)
  DO UPDATE SET level = p_level;
END;
$$;

-- Get activity level for a date, falling back to most recent entry
DROP FUNCTION IF EXISTS activity_level_get;

CREATE FUNCTION activity_level_get(
  p_date DATE
)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_level SMALLINT;
BEGIN
  -- Try exact date
  SELECT level INTO v_level
  FROM activity_level_daily
  WHERE user_id = auth.uid() AND day = p_date;

  IF v_level IS NOT NULL THEN
    RETURN v_level;
  END IF;

  -- Fallback: most recent entry before this date
  SELECT level INTO v_level
  FROM activity_level_daily
  WHERE user_id = auth.uid() AND day < p_date
  ORDER BY day DESC
  LIMIT 1;

  -- Default to 1 (sedentary)
  RETURN COALESCE(v_level, 1);
END;
$$;
