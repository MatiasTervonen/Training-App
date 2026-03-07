-- Manual Report Generation Script
-- Run this in the Supabase SQL Editor after creating a schedule in the app.
-- It loops through ALL active schedules and generates TWO reports each:
--   1) Previous period (e.g. last week) — so deltas have a baseline
--   2) Current period (e.g. this week) — picks up previous_data automatically

DO $$
DECLARE
  v_schedule report_schedules;
  v_period_start DATE;
  v_period_end DATE;
  v_base_period_end DATE;
  v_data_period_days INT;
  v_report_data JSONB;
  v_report_id UUID;
  v_report_count INT := 0;
  v_period_idx INT;
  -- Temp vars for aggregation
  v_gym_sessions JSONB;
  v_act_sessions JSONB;
  v_weight_entries JSONB;
  v_habit_data JSONB;
  v_todo_data JSONB;
BEGIN
  -- Loop through ALL active schedules for the current user
  FOR v_schedule IN
    SELECT * FROM report_schedules
    WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid AND is_active = true
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Generating reports for schedule: % (%)', v_schedule.title, v_schedule.id;

    -- Determine data period
    v_data_period_days := CASE v_schedule.schedule_type
      WHEN 'weekly' THEN 7
      WHEN 'biweekly' THEN 14
      WHEN 'monthly' THEN 30
      WHEN 'quarterly' THEN 90
      ELSE 7
    END;

    v_base_period_end := CURRENT_DATE - 1;  -- yesterday

    -- Generate 2 reports: previous period (idx=1) then current period (idx=0)
    FOR v_period_idx IN REVERSE 1..0 LOOP
    v_report_data := '{}'::jsonb;

    v_period_end := v_base_period_end - (v_period_idx * v_data_period_days);
    v_period_start := v_period_end - v_data_period_days + 1;

    RAISE NOTICE 'Period: % to %', v_period_start, v_period_end;

    -- Aggregate data for each included feature
    -- Gym sessions = sessions that have gym_session_exercises
    IF 'gym' = ANY(v_schedule.included_features) THEN
      WITH gym_ids AS (
        SELECT DISTINCT s.id
        FROM sessions s
        JOIN gym_session_exercises gse ON gse.session_id = s.id
        WHERE s.user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
          AND s.start_time::date BETWEEN v_period_start AND v_period_end
      )
      SELECT jsonb_build_object(
        'session_count', COUNT(*),
        'total_duration', COALESCE(SUM(s.duration), 0),
        'avg_duration', CASE WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(s.duration), 0)::numeric / COUNT(*)) ELSE 0 END,
        'total_volume', COALESCE(ROUND(SUM(ss.total_volume)::numeric), 0),
        'total_calories', COALESCE(ROUND(SUM(ss.calories)::numeric), 0),
        'exercise_count', (
          SELECT COUNT(*) FROM gym_session_exercises gse WHERE gse.session_id IN (SELECT id FROM gym_ids)
        )
      ) INTO v_gym_sessions
      FROM sessions s
      LEFT JOIN session_stats ss ON ss.session_id = s.id
      WHERE s.id IN (SELECT id FROM gym_ids);

      v_report_data := v_report_data || jsonb_build_object('gym', v_gym_sessions);
      RAISE NOTICE 'Gym: %', v_gym_sessions;
    END IF;

    -- Activity sessions = sessions that do NOT have gym_session_exercises
    IF 'activities' = ANY(v_schedule.included_features) THEN
      SELECT jsonb_build_object(
        'session_count', COUNT(*),
        'total_duration', COALESCE(SUM(s.duration), 0),
        'total_distance_meters', COALESCE(ROUND(SUM(ss.distance_meters)::numeric), 0),
        'total_calories', COALESCE(ROUND(SUM(ss.calories)::numeric), 0),
        'total_steps', COALESCE(SUM(ss.steps), 0)
      ) INTO v_act_sessions
      FROM sessions s
      LEFT JOIN session_stats ss ON ss.session_id = s.id
      WHERE s.user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
        AND s.start_time::date BETWEEN v_period_start AND v_period_end
        AND NOT EXISTS (SELECT 1 FROM gym_session_exercises gse WHERE gse.session_id = s.id);

      v_report_data := v_report_data || jsonb_build_object('activities', v_act_sessions);
      RAISE NOTICE 'Activities: %', v_act_sessions;
    END IF;

    IF 'weight' = ANY(v_schedule.included_features) THEN
      WITH weight_entries AS (
        SELECT w.weight, w.created_at
        FROM weight w
        WHERE w.user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
          AND w.created_at::date BETWEEN v_period_start AND v_period_end
        ORDER BY w.created_at
      ),
      weight_agg AS (
        SELECT
          COUNT(*) AS entry_count,
          (SELECT weight FROM weight_entries LIMIT 1) AS start_weight,
          (SELECT weight FROM weight_entries ORDER BY created_at DESC LIMIT 1) AS end_weight
        FROM weight_entries
      )
      SELECT jsonb_build_object(
        'entry_count', entry_count,
        'start_weight', start_weight,
        'end_weight', end_weight,
        'change', CASE
          WHEN start_weight IS NOT NULL AND end_weight IS NOT NULL
          THEN ROUND((end_weight - start_weight)::numeric, 1)
          ELSE NULL
        END
      ) INTO v_weight_entries
      FROM weight_agg;

      v_report_data := v_report_data || jsonb_build_object('weight', v_weight_entries);
      RAISE NOTICE 'Weight: %', v_weight_entries;
    END IF;

    IF 'habits' = ANY(v_schedule.included_features) THEN
      WITH active_habits AS (
        SELECT id FROM habits
        WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid AND is_active = true
      ),
      logs AS (
        SELECT habit_id, completed_date
        FROM habit_logs
        WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
          AND completed_date::date BETWEEN v_period_start AND v_period_end
      ),
      daily_counts AS (
        SELECT completed_date, COUNT(DISTINCT habit_id) AS done_count
        FROM logs
        GROUP BY completed_date
      )
      SELECT jsonb_build_object(
        'completion_rate', CASE
          WHEN (SELECT COUNT(*) FROM active_habits) > 0 AND v_data_period_days > 0
          THEN LEAST(ROUND(
            (SELECT COUNT(*) FROM logs)::numeric /
            ((SELECT COUNT(*) FROM active_habits) * v_data_period_days) * 100
          ), 100)
          ELSE 0
        END,
        'days_all_done', (
          SELECT COUNT(*) FROM daily_counts
          WHERE done_count >= (SELECT COUNT(*) FROM active_habits)
        ),
        'total_days', v_data_period_days,
        'total_completions', (SELECT COUNT(*) FROM logs)
      ) INTO v_habit_data;

      v_report_data := v_report_data || jsonb_build_object('habits', v_habit_data);
      RAISE NOTICE 'Habits: %', v_habit_data;
    END IF;

    IF 'todo' = ANY(v_schedule.included_features) THEN
      SELECT jsonb_build_object(
        'tasks_completed', (
          SELECT COUNT(*) FROM todo_tasks
          WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid AND is_completed = true
          AND updated_at::date BETWEEN v_period_start AND v_period_end
        ),
        'tasks_created', (
          SELECT COUNT(*) FROM todo_tasks
          WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
          AND created_at::date BETWEEN v_period_start AND v_period_end
        ),
        'lists_updated', (
          SELECT COUNT(*) FROM todo_lists
          WHERE user_id = 'fa0f62ef-be31-46b0-ad25-7328f22cb46c'::uuid
          AND updated_at::date BETWEEN v_period_start AND v_period_end
        )
      ) INTO v_todo_data;

      v_report_data := v_report_data || jsonb_build_object('todo', v_todo_data);
      RAISE NOTICE 'Todo: %', v_todo_data;
    END IF;

    RAISE NOTICE 'Full report data: %', v_report_data;

    -- Generate the report (inserts generated_report + feed_item)
    -- The RPC automatically embeds previous_data from the most recent report for this schedule
    SELECT report_generate(
      v_schedule.id,
      v_period_start,
      v_period_end,
      v_report_data
    ) INTO v_report_id;

    v_report_count := v_report_count + 1;
    RAISE NOTICE 'Report generated! ID: % (period idx: %)', v_report_id, v_period_idx;

    END LOOP; -- period loop

  END LOOP; -- schedule loop

  RAISE NOTICE 'Done! Generated % reports (2 per schedule for delta testing). Pull-to-refresh the feed to see them.', v_report_count;
END;
$$;
