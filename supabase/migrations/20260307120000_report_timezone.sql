-- Add timezone column so the edge function can compare day/hour in the user's local time
ALTER TABLE report_schedules
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';

-- Update save RPC to accept timezone
DROP FUNCTION IF EXISTS report_save_schedule;
CREATE FUNCTION report_save_schedule(
  p_title TEXT,
  p_included_features TEXT[],
  p_schedule_type TEXT,
  p_delivery_day_of_week INT DEFAULT NULL,
  p_delivery_day_of_month INT DEFAULT NULL,
  p_delivery_hour INT DEFAULT 8,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count INT;
  v_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM report_schedules
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 report schedules allowed';
  END IF;

  INSERT INTO report_schedules (
    title, included_features, schedule_type,
    delivery_day_of_week, delivery_day_of_month, delivery_hour, timezone
  )
  VALUES (
    p_title, p_included_features, p_schedule_type,
    p_delivery_day_of_week, p_delivery_day_of_month, p_delivery_hour, p_timezone
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Update update RPC to accept timezone
DROP FUNCTION IF EXISTS report_update_schedule;
CREATE FUNCTION report_update_schedule(
  p_schedule_id UUID,
  p_title TEXT,
  p_included_features TEXT[],
  p_schedule_type TEXT,
  p_delivery_day_of_week INT DEFAULT NULL,
  p_delivery_day_of_month INT DEFAULT NULL,
  p_delivery_hour INT DEFAULT 8,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE report_schedules
  SET
    title = p_title,
    included_features = p_included_features,
    schedule_type = p_schedule_type,
    delivery_day_of_week = p_delivery_day_of_week,
    delivery_day_of_month = p_delivery_day_of_month,
    delivery_hour = p_delivery_hour,
    timezone = p_timezone,
    updated_at = now()
  WHERE id = p_schedule_id AND user_id = auth.uid();
END;
$$;
