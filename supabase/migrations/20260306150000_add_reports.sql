-- Report schedules (max 5 per user, enforced in app)
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  included_features TEXT[] NOT NULL DEFAULT '{}',
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  delivery_day_of_week INT CHECK (delivery_day_of_week BETWEEN 0 AND 6),
  delivery_day_of_month INT CHECK (delivery_day_of_month BETWEEN 1 AND 28),
  delivery_hour INT NOT NULL DEFAULT 8 CHECK (delivery_hour BETWEEN 0 AND 23),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_delivery CHECK (
    (schedule_type IN ('weekly', 'biweekly') AND delivery_day_of_week IS NOT NULL)
    OR (schedule_type IN ('monthly', 'quarterly') AND delivery_day_of_month IS NOT NULL)
  )
);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
F
CREATE POLICY "Users can CRUD own report schedules"
  ON report_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_report_schedules_user ON report_schedules(user_id);
CREATE INDEX idx_report_schedules_active ON report_schedules(is_active, schedule_type);

-- Generated reports (one per schedule per delivery)
CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generated reports"
  ON generated_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated reports"
  ON generated_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert generated reports"
  ON generated_reports FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_generated_reports_user ON generated_reports(user_id, created_at DESC);
CREATE INDEX idx_generated_reports_schedule ON generated_reports(schedule_id, created_at DESC);

-- RPC: report_get_schedules
DROP FUNCTION IF EXISTS report_get_schedules;
CREATE FUNCTION report_get_schedules()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(row_to_json(sub))
     FROM (
       SELECT * FROM report_schedules s
       WHERE s.user_id = auth.uid() AND s.is_active = true
       ORDER BY s.created_at
     ) sub),
    '[]'::jsonb
  );
END;
$$;

-- RPC: report_save_schedule
DROP FUNCTION IF EXISTS report_save_schedule;
CREATE FUNCTION report_save_schedule(
  p_title TEXT,
  p_included_features TEXT[],
  p_schedule_type TEXT,
  p_delivery_day_of_week INT DEFAULT NULL,
  p_delivery_day_of_month INT DEFAULT NULL,
  p_delivery_hour INT DEFAULT 8
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count INT;
  v_id UUID;
BEGIN
  -- Enforce max 5 active schedules
  SELECT COUNT(*) INTO v_count
  FROM report_schedules
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 report schedules allowed';
  END IF;

  INSERT INTO report_schedules (
    title, included_features, schedule_type,
    delivery_day_of_week, delivery_day_of_month, delivery_hour
  )
  VALUES (
    p_title, p_included_features, p_schedule_type,
    p_delivery_day_of_week, p_delivery_day_of_month, p_delivery_hour
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- RPC: report_update_schedule
DROP FUNCTION IF EXISTS report_update_schedule;
CREATE FUNCTION report_update_schedule(
  p_schedule_id UUID,
  p_title TEXT,
  p_included_features TEXT[],
  p_schedule_type TEXT,
  p_delivery_day_of_week INT DEFAULT NULL,
  p_delivery_day_of_month INT DEFAULT NULL,
  p_delivery_hour INT DEFAULT 8
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
    updated_at = now()
  WHERE id = p_schedule_id AND user_id = auth.uid();
END;
$$;

-- RPC: report_delete_schedule
DROP FUNCTION IF EXISTS report_delete_schedule;
CREATE FUNCTION report_delete_schedule(
  p_schedule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM report_schedules
  WHERE id = p_schedule_id AND user_id = auth.uid();
END;
$$;

-- Update feed_delete_session to support 'reports' type
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
    'habits',
    'reports'
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

  -- Delete domain row
  IF p_type IN ('habits', 'reports') THEN
    -- Reports: delete the generated_report row
    IF p_type = 'reports' THEN
      DELETE FROM generated_reports WHERE id = p_id;
    END IF;
  ELSIF p_type IN ('gym_sessions', 'activity_sessions') THEN
    DELETE FROM sessions WHERE id = p_id;
  ELSE
    EXECUTE format('DELETE FROM %I WHERE id = $1', p_type) USING p_id;
  END IF;
END;
$$;

-- RPC: report_generate (called by Edge Function with service role)
DROP FUNCTION IF EXISTS report_generate;
CREATE FUNCTION report_generate(
  p_schedule_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_report_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule report_schedules;
  v_report_id UUID;
  v_feed_item_id UUID;
BEGIN
  SELECT * INTO v_schedule FROM report_schedules WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;

  -- Insert generated report
  INSERT INTO generated_reports (user_id, schedule_id, title, period_start, period_end, report_data)
  VALUES (v_schedule.user_id, p_schedule_id, v_schedule.title, p_period_start, p_period_end, p_report_data)
  RETURNING id INTO v_report_id;

  -- Insert feed item
  INSERT INTO feed_items (user_id, type, source_id, title, occurred_at, extra_fields)
  VALUES (
    v_schedule.user_id,
    'reports',
    v_report_id,
    v_schedule.title,
    now(),
    jsonb_build_object(
      'period_start', p_period_start,
      'period_end', p_period_end,
      'included_features', v_schedule.included_features,
      'schedule_id', p_schedule_id
    )
  )
  RETURNING id INTO v_feed_item_id;

  RETURN v_report_id;
END;
$$;
