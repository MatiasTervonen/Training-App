-- Update report_generate to embed previous_data for delta comparison
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
  v_previous_data JSONB;
  v_final_data JSONB;
BEGIN
  SELECT * INTO v_schedule FROM report_schedules WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;

  -- Look up the most recent previous report for this schedule
  SELECT gr.report_data INTO v_previous_data
  FROM generated_reports gr
  WHERE gr.schedule_id = p_schedule_id
  ORDER BY gr.created_at DESC
  LIMIT 1;

  -- Build final data with previous_data for delta comparison
  v_final_data := p_report_data;
  IF v_previous_data IS NOT NULL THEN
    v_final_data := v_final_data || jsonb_build_object(
      'previous_data', v_previous_data - 'previous_data'
    );
  END IF;

  -- Insert generated report
  INSERT INTO generated_reports (user_id, schedule_id, title, period_start, period_end, report_data)
  VALUES (v_schedule.user_id, p_schedule_id, v_schedule.title, p_period_start, p_period_end, v_final_data)
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
