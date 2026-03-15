# Reports — Feature Spec

## Context

Users want periodic summaries of their training progress — what they've done, how consistent they've been, and key stats across features. The Reports feature lets users schedule recurring reports (e.g., weekly or monthly) that aggregate data from chosen app features over a configurable time period. When a report is ready, the user gets a push notification and the report appears as a card in the feed. Reports can be shared using the existing share card system.

---

## Requirements

- Create, edit, and delete report schedules (title, included features, delivery day, delivery time, data period)
- Default report presets: "Weekly Report" (every week on Monday at 8:00) and "Monthly Report" (every month on 1st at 8:00)
- Maximum 5 report schedules per user
- Configurable included features: Gym, Activities, Weight, Habits, Todo
- Configurable schedule: Every week, Every 2 weeks, Every month, Every 3 months
- Delivery day: weekday (for weekly/biweekly) or day of month 1–28 (for monthly/quarterly)
- Delivery time: hour of day (6–22), default 8:00
- Data period automatically matches the schedule interval
- Automatic push notification when a report is generated
- Report appears as a feed card with type `reports`
- Expanded view shows the full report with stats per included feature
- Share card support using the existing `useShareCard` pattern
- Report generation runs server-side via a Supabase cron + Edge Function

---

## How It Works

### Reports Management Page (`/reports`)

```
┌─ Reports ──────────────────────┐
│                                │
│  Your Reports (2/5)            │
│                                │
│  ┌──────────────────────────┐  │
│  │ Weekly Report            │  │
│  │ Every week · Monday · 8:00│  │
│  │ Gym, Activities, Weight  │  │
│  │ [Edit]  [Delete]         │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Monthly Report           │  │
│  │ Every month · 1st · 8:00 │  │
│  │ All features             │  │
│  │ [Edit]  [Delete]         │  │
│  └──────────────────────────┘  │
│                                │
│  [+ Create Report]             │
│                                │
│  ── Quick Add ──               │
│  [Weekly Report] [Monthly]     │
└────────────────────────────────┘
```

- Shows all report schedules with summary info
- Count indicator (2/5) shows usage vs. limit
- Quick-add buttons for default presets (only if under limit)
- Each report card shows title, schedule, delivery time, and included features

### Create/Edit Report (`/reports/create`)

```
┌─ New Report ───────────────────┐
│                                │
│  Title: [Weekly Report       ] │
│                                │
│  Include:                      │
│  ☑ Gym                        │
│  ☑ Activities                  │
│  ☑ Weight                      │
│  ☐ Habits                      │
│  ☐ Todo                        │
│                                │
│  Schedule:                     │
│  [Every week ▼]               │
│                                │
│  Deliver on:                   │
│  [Monday ▼]                    │
│                                │
│  Delivery time:                │
│  [08:00 ▼]                     │
│                                │
│  [Save]                        │
└────────────────────────────────┘
```

- Title: required, `AppInput`
- Include: checkboxes for each feature (at least 1 required)
- Schedule: dropdown with "Every week", "Every 2 weeks", "Every month", "Every 3 months"
- Deliver on: weekday dropdown (for weekly/biweekly) or day-of-month 1–28 (for monthly/quarterly)
- Delivery time: hour dropdown (6:00–22:00 in 1-hour steps), default 8:00. Uses user's local timezone (stored as UTC offset at save time)
- Data period is implicit — matches the schedule interval (7, 14, 30, or 90 days)
- Validation: max 5 reports per user enforced on save

### Report Feed Card (collapsed)

```
┌─────────────────────────────────────┐
│ Weekly Report              [···]    │
│                                     │
│  Mar 3 – Mar 9                      │
│  Gym: 4 sessions · Activities: 2    │
│                                     │
│  [📊 Report] [Mar 10]  [Details →] │
└─────────────────────────────────────┘
```

- Title from report schedule
- Date range shown as subtitle
- Quick summary of included features
- Uses `BaseFeedCard` with report-specific stats content

### Report Expanded View

```
┌─ Weekly Report ────────────────┐
│  Mar 3 – Mar 9, 2026    [Share]│
│                                │
│  ┌─ Gym ─────────────────────┐ │
│  │ Sessions: 4               │ │
│  │ Total Volume: 12,450 kg   │ │
│  │ Total Duration: 4h 20min  │ │
│  │ Avg Duration: 1h 5min     │ │
│  │ Total Calories: 1,240     │ │
│  │ Exercises: 18             │ │
│  └───────────────────────────┘ │
│                                │
│  ┌─ Activities ──────────────┐ │
│  │ Sessions: 2               │ │
│  │ Total Distance: 14.2 km   │ │
│  │ Total Duration: 1h 45min  │ │
│  │ Total Calories: 890       │ │
│  │ Total Steps: 18,400       │ │
│  └───────────────────────────┘ │
│                                │
│  ┌─ Weight ──────────────────┐ │
│  │ Entries: 5                │ │
│  │ Start: 82.5 kg            │ │
│  │ End: 81.8 kg              │ │
│  │ Change: -0.7 kg           │ │
│  └───────────────────────────┘ │
│                                │
│  ┌─ Habits ──────────────────┐ │
│  │ Completion Rate: 85%      │ │
│  │ Days All Done: 5/7        │ │
│  │ Best Streak: 5 days       │ │
│  └───────────────────────────┘ │
│                                │
│  ┌─ Todo ────────────────────┐ │
│  │ Tasks Completed: 12       │ │
│  │ Tasks Created: 8          │ │
│  │ Lists Updated: 3          │ │
│  └───────────────────────────┘ │
└────────────────────────────────┘
```

- Full stats for each included feature
- Share button opens share card modal
- Scrollable content

### Share Card

```
┌─────────────── 1080x1080 ──────────────┐
│  ┌─ gradient header ────────────────┐  │
│  │      Weekly Report               │  │
│  │      Mar 3 – Mar 9, 2026        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌─ Gym ──────┐  ┌─ Activities ────┐  │
│  │ 4 sessions │  │ 2 sessions     │  │
│  │ 12,450 kg  │  │ 14.2 km        │  │
│  │ 4h 20min   │  │ 1h 45min       │  │
│  └────────────┘  └────────────────┘  │
│                                        │
│  ┌─ Weight ───┐  ┌─ Habits ────────┐  │
│  │ -0.7 kg    │  │ 85% done       │  │
│  │ 82.5→81.8  │  │ 5 day streak   │  │
│  └────────────┘  └────────────────┘  │
│                                        │
│              Training App              │
└────────────────────────────────────────┘
```

- Follows existing share card pattern (1080x1080, `LinearGradient`, `StatCard` grid)
- Adapts grid layout based on number of **selected** features (same logic as activity share)
- Feature toggle chips above the card preview let user show/hide features (same `StatToggleChips` pattern as activity share)
- Uses `useShareCard` hook

---

## Data Flow

### Report Generation (Server-Side)

1. Supabase cron job runs **every hour**
2. Calls Edge Function `generate-reports` with the current UTC hour
3. Edge Function queries `report_schedules` for schedules due now:
   - Day match: Weekly/Biweekly check `delivery_day_of_week`, Monthly/Quarterly check `delivery_day_of_month`
   - Hour match: `delivery_hour` matches the current UTC hour (stored as UTC at save time)
   - Biweekly also checks last report was 2+ weeks ago; Quarterly checks 3+ months ago
4. For each due schedule, aggregates data from relevant tables based on `included_features` and the schedule type's implicit data period
5. Inserts generated report into `generated_reports` table
6. Inserts feed item into `feed_items` with type `reports`
7. Sends push notification via Expo Push API

### Client-Side Flow

1. Feed loads → report cards appear with type `reports`
2. User taps "Details" → expanded view fetches full report data from `generated_reports`
3. User taps "Share" → share modal renders share card → native share sheet

---

## Step 1: Database Migration

### `supabase/migrations/20260305210000_add_reports.sql`

```sql
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

CREATE POLICY "Service can insert generated reports"
  ON generated_reports FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_generated_reports_user ON generated_reports(user_id, created_at DESC);
CREATE INDEX idx_generated_reports_schedule ON generated_reports(schedule_id, created_at DESC);
```

### RPC: `report_get_schedules`

```sql
DROP FUNCTION IF EXISTS report_get_schedules;
CREATE FUNCTION report_get_schedules()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(row_to_json(s))
     FROM report_schedules s
     WHERE s.user_id = auth.uid() AND s.is_active = true
     ORDER BY s.created_at),
    '[]'::jsonb
  );
END;
$$;
```

### RPC: `report_save_schedule`

```sql
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
```

### RPC: `report_update_schedule`

```sql
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
```

### RPC: `report_delete_schedule`

```sql
DROP FUNCTION IF EXISTS report_delete_schedule;
CREATE FUNCTION report_delete_schedule(
  p_schedule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE report_schedules
  SET is_active = false, updated_at = now()
  WHERE id = p_schedule_id AND user_id = auth.uid();
END;
$$;
```

### RPC: `report_generate` (called by Edge Function with service role)

```sql
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
```

> **Note:** `report_generate` uses `SECURITY DEFINER` because it's called by the Edge Function with the service role key, not by the user directly. This is intentional.

---

## Step 2: Edge Function — Report Generation

### `supabase/functions/generate-reports/index.ts` (NEW)

This Edge Function is triggered by a Supabase cron job daily.

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Verify the request is from our cron job using the service role key
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday
  const dayOfMonth = today.getDate();
  const currentHour = today.getUTCHours();

  // Get all active schedules that match today's day AND current hour
  // Biweekly/quarterly schedules need additional check (see filtering below)
  const { data: schedules, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("is_active", true)
    .eq("delivery_hour", currentHour)
    .or(
      `and(schedule_type.in.(weekly,biweekly),delivery_day_of_week.eq.${dayOfWeek}),and(schedule_type.in.(monthly,quarterly),delivery_day_of_month.eq.${dayOfMonth})`,
    );

  if (error || !schedules) {
    return new Response(JSON.stringify({ error: "Failed to fetch schedules" }), {
      status: 500,
    });
  }

  // Map schedule_type to data period in days
  const periodDaysMap: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
  };

  for (const schedule of schedules) {
    try {
      // For biweekly: check if it's been 2 weeks since last report
      if (schedule.schedule_type === "biweekly") {
        const { data: lastReport } = await supabase
          .from("generated_reports")
          .select("created_at")
          .eq("schedule_id", schedule.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (lastReport) {
          const daysSinceLast = Math.floor(
            (today.getTime() - new Date(lastReport.created_at).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceLast < 13) continue; // Skip — too soon (allow 1 day tolerance)
        }
      }

      // For quarterly: check if it's been ~3 months since last report
      if (schedule.schedule_type === "quarterly") {
        const { data: lastReport } = await supabase
          .from("generated_reports")
          .select("created_at")
          .eq("schedule_id", schedule.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (lastReport) {
          const daysSinceLast = Math.floor(
            (today.getTime() - new Date(lastReport.created_at).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceLast < 85) continue; // Skip — too soon (allow 5 day tolerance)
        }
      }

      const dataPeriodDays = periodDaysMap[schedule.schedule_type] || 7;
      const periodEnd = new Date(today);
      periodEnd.setDate(periodEnd.getDate() - 1); // yesterday
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - dataPeriodDays + 1);

      const reportData = await aggregateReportData(
        supabase,
        schedule.user_id,
        schedule.included_features,
        periodStart,
        periodEnd,
      );

      // Generate the report (inserts report + feed item)
      const { data: reportId } = await supabase.rpc("report_generate", {
        p_schedule_id: schedule.id,
        p_period_start: formatDate(periodStart),
        p_period_end: formatDate(periodEnd),
        p_report_data: reportData,
      });

      // Send push notification
      const { data: tokens } = await supabase
        .from("user_push_mobile_subscriptions")
        .select("token")
        .eq("user_id", schedule.user_id)
        .eq("is_active", true);

      if (tokens && tokens.length > 0) {
        const messages = tokens.map((t) => ({
          to: t.token,
          title: schedule.title,
          body: `Your ${schedule.title.toLowerCase()} is ready!`,
          data: { type: "report", reportId },
          channelId: "reports",
          sound: "default",
        }));

        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });
      }

      // Insert in-app notification
      await supabase.from("notifications").insert({
        user_id: schedule.user_id,
        type: "report_ready",
        title: schedule.title,
        body: `Your ${schedule.title.toLowerCase()} is ready!`,
        data: { reportId, scheduleId: schedule.id },
      });
    } catch (err) {
      console.error(`Failed to generate report for schedule ${schedule.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ processed: schedules.length }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function aggregateReportData(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  features: string[],
  periodStart: Date,
  periodEnd: Date,
) {
  const start = formatDate(periodStart);
  const end = formatDate(periodEnd);
  const data: Record<string, unknown> = {};

  for (const feature of features) {
    switch (feature) {
      case "gym": {
        // Get gym sessions in period
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, duration, created_at, session_stats(total_volume, calories)")
          .eq("user_id", userId)
          .eq("type", "gym")
          .gte("created_at", start)
          .lte("created_at", end + "T23:59:59Z");

        const gymSessions = sessions || [];
        const totalDuration = gymSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalVolume = gymSessions.reduce(
          (sum, s) => sum + (s.session_stats?.total_volume || 0),
          0,
        );
        const totalCalories = gymSessions.reduce(
          (sum, s) => sum + (s.session_stats?.calories || 0),
          0,
        );

        // Count exercises
        const sessionIds = gymSessions.map((s) => s.id);
        let exerciseCount = 0;
        if (sessionIds.length > 0) {
          const { count } = await supabase
            .from("gym_session_exercises")
            .select("id", { count: "exact", head: true })
            .in("session_id", sessionIds);
          exerciseCount = count || 0;
        }

        data.gym = {
          session_count: gymSessions.length,
          total_duration: totalDuration,
          avg_duration: gymSessions.length ? Math.round(totalDuration / gymSessions.length) : 0,
          total_volume: Math.round(totalVolume),
          total_calories: Math.round(totalCalories),
          exercise_count: exerciseCount,
        };
        break;
      }

      case "activities": {
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, duration, created_at, session_stats(calories, steps, distance_meters)")
          .eq("user_id", userId)
          .eq("type", "activity")
          .gte("created_at", start)
          .lte("created_at", end + "T23:59:59Z");

        const actSessions = sessions || [];
        const totalDuration = actSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalDistance = actSessions.reduce(
          (sum, s) => sum + (s.session_stats?.distance_meters || 0),
          0,
        );
        const totalCalories = actSessions.reduce(
          (sum, s) => sum + (s.session_stats?.calories || 0),
          0,
        );
        const totalSteps = actSessions.reduce(
          (sum, s) => sum + (s.session_stats?.steps || 0),
          0,
        );

        data.activities = {
          session_count: actSessions.length,
          total_duration: totalDuration,
          total_distance_meters: Math.round(totalDistance),
          total_calories: Math.round(totalCalories),
          total_steps: totalSteps,
        };
        break;
      }

      case "weight": {
        const { data: entries } = await supabase
          .from("weight")
          .select("weight, created_at")
          .eq("user_id", userId)
          .gte("created_at", start)
          .lte("created_at", end + "T23:59:59Z")
          .order("created_at", { ascending: true });

        const weightEntries = entries || [];
        const first = weightEntries[0]?.weight ?? null;
        const last = weightEntries[weightEntries.length - 1]?.weight ?? null;

        data.weight = {
          entry_count: weightEntries.length,
          start_weight: first,
          end_weight: last,
          change: first && last ? Math.round((last - first) * 10) / 10 : null,
        };
        break;
      }

      case "habits": {
        const { data: logs } = await supabase
          .from("habit_logs")
          .select("habit_id, completed_date")
          .eq("user_id", userId)
          .gte("completed_date", start)
          .lte("completed_date", end);

        const { data: habits } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        const habitLogs = logs || [];
        const activeHabits = habits || [];
        const totalDays = Math.ceil(
          (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

        // Days where ALL habits were completed
        const logsByDate: Record<string, Set<string>> = {};
        for (const log of habitLogs) {
          if (!logsByDate[log.completed_date]) {
            logsByDate[log.completed_date] = new Set();
          }
          logsByDate[log.completed_date].add(log.habit_id);
        }

        const daysAllDone = Object.values(logsByDate).filter(
          (s) => s.size >= activeHabits.length,
        ).length;

        const completionRate =
          activeHabits.length > 0 && totalDays > 0
            ? Math.round((habitLogs.length / (activeHabits.length * totalDays)) * 100)
            : 0;

        data.habits = {
          completion_rate: Math.min(completionRate, 100),
          days_all_done: daysAllDone,
          total_days: totalDays,
          total_completions: habitLogs.length,
        };
        break;
      }

      case "todo": {
        // Tasks completed in period
        const { data: completedTasks } = await supabase
          .from("todo_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_completed", true)
          .gte("updated_at", start)
          .lte("updated_at", end + "T23:59:59Z");

        // Tasks created in period
        const { data: createdTasks } = await supabase
          .from("todo_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", start)
          .lte("created_at", end + "T23:59:59Z");

        // Lists updated in period
        const { data: updatedLists } = await supabase
          .from("todo_lists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("updated_at", start)
          .lte("updated_at", end + "T23:59:59Z");

        data.todo = {
          tasks_completed: completedTasks || 0,
          tasks_created: createdTasks || 0,
          lists_updated: updatedLists || 0,
        };
        break;
      }
    }
  }

  return data;
}
```

### Cron Job Setup

Add to Supabase Dashboard → Database → Extensions → enable `pg_cron`, then:

```sql
-- Run every hour to match per-user delivery times
SELECT cron.schedule(
  'generate-hourly-reports',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-reports',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'
  );
  $$
);
```

---

## Step 3: Database Functions (TypeScript)

### `database/reports/get-report-schedules.ts` (NEW) — RPC

- Calls `report_get_schedules` RPC
- Returns array of `ReportSchedule`

### `database/reports/save-report-schedule.ts` (NEW) — RPC

- Calls `report_save_schedule` RPC with title, features, schedule_type, delivery day, delivery_hour
- Returns the new schedule ID

### `database/reports/update-report-schedule.ts` (NEW) — RPC

- Calls `report_update_schedule` RPC

### `database/reports/delete-report-schedule.ts` (NEW) — RPC

- Calls `report_delete_schedule` RPC (soft delete)

### `database/reports/get-generated-report.ts` (NEW) — Direct query

- `supabase.from('generated_reports').select('*').eq('id', reportId).eq('user_id', userId).single()`
- Returns the full generated report with `report_data` JSONB

---

## Step 4: Types

### `types/report.ts` (NEW)

```ts
export type ReportSchedule = {
  id: string;
  user_id: string;
  title: string;
  included_features: ReportFeature[];
  schedule_type: ScheduleType;
  delivery_day_of_week: number | null; // 0-6 (Sun-Sat)
  delivery_day_of_month: number | null; // 1-28
  delivery_hour: number; // 0-23 (UTC), default 8
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleType = "weekly" | "biweekly" | "monthly" | "quarterly";

export type ReportFeature = "gym" | "activities" | "weight" | "habits" | "todo";

export type GeneratedReport = {
  id: string;
  user_id: string;
  schedule_id: string;
  title: string;
  period_start: string; // "YYYY-MM-DD"
  period_end: string; // "YYYY-MM-DD"
  report_data: ReportData;
  created_at: string;
};

export type ReportData = {
  gym?: GymReportData;
  activities?: ActivitiesReportData;
  weight?: WeightReportData;
  habits?: HabitsReportData;
  todo?: TodoReportData;
};

export type GymReportData = {
  session_count: number;
  total_duration: number;
  avg_duration: number;
  total_volume: number;
  total_calories: number;
  exercise_count: number;
};

export type ActivitiesReportData = {
  session_count: number;
  total_duration: number;
  total_distance_meters: number;
  total_calories: number;
  total_steps: number;
};

export type WeightReportData = {
  entry_count: number;
  start_weight: number | null;
  end_weight: number | null;
  change: number | null;
};

export type HabitsReportData = {
  completion_rate: number;
  days_all_done: number;
  total_days: number;
  total_completions: number;
};

export type TodoReportData = {
  tasks_completed: number;
  tasks_created: number;
  lists_updated: number;
};

export const REPORT_FEATURES: { key: ReportFeature; labelKey: string }[] = [
  { key: "gym", labelKey: "reports.features.gym" },
  { key: "activities", labelKey: "reports.features.activities" },
  { key: "weight", labelKey: "reports.features.weight" },
  { key: "habits", labelKey: "reports.features.habits" },
  { key: "todo", labelKey: "reports.features.todo" },
];

export const SCHEDULE_TYPES: { key: ScheduleType; labelKey: string; days: number }[] = [
  { key: "weekly", labelKey: "reports.scheduleTypes.weekly", days: 7 },
  { key: "biweekly", labelKey: "reports.scheduleTypes.biweekly", days: 14 },
  { key: "monthly", labelKey: "reports.scheduleTypes.monthly", days: 30 },
  { key: "quarterly", labelKey: "reports.scheduleTypes.quarterly", days: 90 },
];

export const MAX_REPORTS = 5;
```

---

## Step 5: React Query Hooks

### `features/reports/hooks/useReportSchedules.ts` (NEW)

- `useQuery` to fetch all active schedules via `get-report-schedules.ts`
- Query key: `["report-schedules"]`

### `features/reports/hooks/useSaveReportSchedule.ts` (NEW)

- `useMutation` calling `save-report-schedule.ts`
- On success: invalidate `["report-schedules"]`

### `features/reports/hooks/useUpdateReportSchedule.ts` (NEW)

- `useMutation` calling `update-report-schedule.ts`
- On success: invalidate `["report-schedules"]`

### `features/reports/hooks/useDeleteReportSchedule.ts` (NEW)

- `useMutation` calling `delete-report-schedule.ts`
- On success: invalidate `["report-schedules"]`

### `features/reports/hooks/useGeneratedReport.ts` (NEW)

- `useQuery` to fetch a specific generated report for the expanded view
- Query key: `["generated-report", reportId]`
- `enabled: !!reportId`

---

## Step 6: Components

### `features/reports/components/ReportScheduleCard.tsx` (NEW)

- Single schedule card for the management page
- Shows: title, frequency + delivery day + delivery time, included feature chips
- Edit and Delete buttons using `AnimatedButton`
- Delete with confirmation alert

### `features/reports/components/FeatureCheckbox.tsx` (NEW)

- Checkbox row for selecting features to include
- Icon + label + checkbox
- Uses `AnimatedButton` for tap

### `features/reports/components/SchedulePicker.tsx` (NEW)

- Dropdown for schedule type: "Every week", "Every 2 weeks", "Every month", "Every 3 months"
- Conditionally shows weekday dropdown (weekly/biweekly) or day-of-month dropdown (monthly/quarterly)
- Delivery time dropdown: hours from 6:00 to 22:00 (1-hour steps), default 8:00. User picks in local time; value is converted to UTC hour on save.
- Uses `SCHEDULE_TYPES` constant for options

### `features/reports/components/ReportSection.tsx` (NEW)

- Renders a single feature section in the expanded report
- Takes feature name + data object
- Renders stat rows with labels and values
- Reused by both expanded view and share card

### `features/reports/cards/report-feed.tsx` (NEW)

- Feed card component for reports
- Uses `BaseFeedCard` with report-specific stats content
- Shows date range and brief summary of included features
- Icon: `FileBarChart` from lucide

### `features/reports/cards/report-expanded.tsx` (NEW)

- Full expanded report view in `FullScreenModal`
- Fetches full report via `useGeneratedReport` on mount
- Renders `ReportSection` for each included feature
- Share button → opens `ReportShareModal`
- Uses `ScrollView` with `PageContainer`

### `features/reports/components/ReportShareModal.tsx` (NEW)

- Modal following activity share pattern (`ActivityShareModal`)
- Uses `useShareCard` hook
- Feature toggle chips (same `StatToggleChips` pattern): user can show/hide features on the share card
  - Available chips = features present in the report's `report_data` (only features with data)
  - All selected by default on modal open
  - Min 1 feature selected; toast + haptic feedback on limits
- Renders `ReportShareCard` (1080x1080) for capture, passing only selected features
- Card preview updates in real time as user toggles chips

### `features/reports/components/ReportShareCard.tsx` (NEW)

- 1080x1080 share card with `LinearGradient`
- Header: title + date range
- Grid of `StatCard` components per **selected** feature (adaptive layout based on count)
  - 1 feature: single large card
  - 2 features: 2 columns
  - 3 features: 3 columns or 2+1
  - 4 features: 2x2 grid
  - 5 features: 3+2 layout
- Each feature card shows 2–3 key stats (fixed per feature type)
- Footer watermark
- Uses `forwardRef` for capture via `useShareCard`

---

## Step 7: Pages

### `app/reports/index.tsx` (NEW) — Report management

- Wrapped with `ModalPageWrapper`
- Lists all active schedules using `ReportScheduleCard`
- Shows count indicator (X/5)
- "Create Report" button (disabled if at limit)
- Quick-add section with preset buttons ("Weekly Report", "Monthly Report")
- Quick-add buttons auto-fill create form with sensible defaults
- Empty state: "No reports yet — create your first report"
- Keyboard dismiss wrapper

### `app/reports/create.tsx` (NEW) — Create/edit report schedule

- Wrapped with `ModalPageWrapper`
- Fields:
  - `AppInput` for title
  - `FeatureCheckbox` list (at least 1 required)
  - `SchedulePicker` (every week / every 2 weeks / every month / every 3 months)
  - Delivery day picker (weekday dropdown or day-of-month, driven by schedule type)
  - Delivery time picker (hour dropdown 6:00–22:00, default 8:00)
- Route params: `id` for editing, `preset` for quick-add ("weekly" or "monthly")
- Preset defaults:
  - Weekly: title="Weekly Report", schedule_type=weekly, day=Monday (1), hour=8, all features
  - Monthly: title="Monthly Report", schedule_type=monthly, day=1, hour=8, all features
- Validation before save: title required, at least 1 feature, valid delivery day
- Save calls `useSaveReportSchedule` or `useUpdateReportSchedule`
- On save: toast + navigate back
- Keyboard dismiss on tap outside

---

## Step 8: Feed Integration

### `features/feed-cards/FeedCard.tsx` (MODIFY)

Add report card case:

```tsx
import ReportCard from "@/features/reports/cards/report-feed";

// In switch statement:
case "reports":
  return <ReportCard {...commomProps} />;
```

### `features/feed/SessionFeed.tsx` (MODIFY)

Add expanded report view:

```tsx
import ReportSession from "@/features/reports/cards/report-expanded";

// In expanded item section:
{expandedItem.type === "reports" && (
  <ReportSession item={expandedItem} />
)}
```

### `features/feed/hooks/useFullSessions.ts` (MODIFY)

No changes needed — report expanded view fetches its own data via `useGeneratedReport` hook using `source_id` from the feed item.

### `features/feed/hooks/useDeleteSession.ts` (MODIFY)

Add handling for `reports` type deletion if needed (delete the generated report).

---

## Step 9: Navigation Integration

### Sessions page (`app/sessions/index.tsx`) (MODIFY)

Add reports link:

```tsx
<LinkButton label={t("sessions.reports")} href="/reports">
  <FileBarChart size={20} color="#f3f4f6" />
</LinkButton>
```

Use `FileBarChart` icon from `lucide-react-native`.

---

## Step 10: Translations

### `locales/en/reports.json` (NEW)

```json
{
  "title": "Reports",
  "yourReports": "Your Reports",
  "noReports": "No reports yet",
  "createFirst": "Create your first report to get periodic summaries",
  "createReport": "Create Report",
  "editReport": "Edit Report",
  "maxReached": "Maximum 5 reports reached",
  "quickAdd": "Quick Add",
  "reportName": "Report Title",
  "reportNamePlaceholder": "e.g. Weekly Report",
  "include": "Include",
  "features": {
    "gym": "Gym",
    "activities": "Activities",
    "weight": "Weight",
    "habits": "Habits",
    "todo": "Todo"
  },
  "schedule": "Schedule",
  "deliverOn": "Deliver on",
  "deliveryTime": "Delivery time",
  "scheduleTypes": {
    "weekly": "Every week",
    "biweekly": "Every 2 weeks",
    "monthly": "Every month",
    "quarterly": "Every 3 months"
  },
  "save": "Save",
  "delete": "Delete Report",
  "deleteConfirm": "Are you sure you want to delete this report schedule?",
  "saved": "Report saved!",
  "deleted": "Report deleted",
  "errorSaving": "Failed to save report",
  "errorDeleting": "Failed to delete report",
  "atLeastOneFeature": "Select at least one feature",
  "titleRequired": "Title is required",
  "weekdays": {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday"
  },
  "dayOfMonth": "Day {{day}} of month",
  "expanded": {
    "periodLabel": "{{start}} – {{end}}",
    "sessions": "Sessions",
    "totalDuration": "Total Duration",
    "avgDuration": "Avg Duration",
    "totalVolume": "Total Volume",
    "totalCalories": "Total Calories",
    "exercises": "Exercises",
    "totalDistance": "Total Distance",
    "totalSteps": "Total Steps",
    "entries": "Entries",
    "startWeight": "Start",
    "endWeight": "End",
    "weightChange": "Change",
    "completionRate": "Completion Rate",
    "daysAllDone": "Days All Done",
    "totalCompletions": "Total Completions",
    "tasksCompleted": "Tasks Completed",
    "tasksCreated": "Tasks Created",
    "listsUpdated": "Lists Updated"
  },
  "share": {
    "share": "Share",
    "sharing": "Sharing...",
    "close": "Close",
    "shareError": "Failed to share report",
    "minFeature": "At least one feature required",
    "showOnCard": "Show on card"
  },
  "presets": {
    "weekly": "Weekly Report",
    "monthly": "Monthly Report"
  }
}
```

### `locales/fi/reports.json` (NEW)

```json
{
  "title": "Raportit",
  "yourReports": "Omat raportit",
  "noReports": "Ei vielä raportteja",
  "createFirst": "Luo ensimmäinen raportti saadaksesi säännöllisiä yhteenvetoja",
  "createReport": "Luo raportti",
  "editReport": "Muokkaa raporttia",
  "maxReached": "Enintään 5 raporttia sallittu",
  "quickAdd": "Pikalisäys",
  "reportName": "Raportin otsikko",
  "reportNamePlaceholder": "esim. Viikkoraportti",
  "include": "Sisällytä",
  "features": {
    "gym": "Kuntosali",
    "activities": "Aktiviteetit",
    "weight": "Paino",
    "habits": "Tavat",
    "todo": "Tehtävät"
  },
  "schedule": "Aikataulu",
  "deliverOn": "Toimita",
  "deliveryTime": "Toimitusaika",
  "scheduleTypes": {
    "weekly": "Joka viikko",
    "biweekly": "Joka 2. viikko",
    "monthly": "Joka kuukausi",
    "quarterly": "Joka 3. kuukausi"
  },
  "save": "Tallenna",
  "delete": "Poista raportti",
  "deleteConfirm": "Haluatko varmasti poistaa tämän raportin?",
  "saved": "Raportti tallennettu!",
  "deleted": "Raportti poistettu",
  "errorSaving": "Raportin tallennus epäonnistui",
  "errorDeleting": "Raportin poistaminen epäonnistui",
  "atLeastOneFeature": "Valitse vähintään yksi ominaisuus",
  "titleRequired": "Otsikko on pakollinen",
  "weekdays": {
    "0": "Sunnuntai",
    "1": "Maanantai",
    "2": "Tiistai",
    "3": "Keskiviikko",
    "4": "Torstai",
    "5": "Perjantai",
    "6": "Lauantai"
  },
  "dayOfMonth": "Kuukauden {{day}}. päivä",
  "expanded": {
    "periodLabel": "{{start}} – {{end}}",
    "sessions": "Harjoitukset",
    "totalDuration": "Kokonaiskesto",
    "avgDuration": "Keskikesto",
    "totalVolume": "Kokonaisvolyymi",
    "totalCalories": "Kalorit yhteensä",
    "exercises": "Liikkeet",
    "totalDistance": "Kokonaismatka",
    "totalSteps": "Askeleet yhteensä",
    "entries": "Merkinnät",
    "startWeight": "Alku",
    "endWeight": "Loppu",
    "weightChange": "Muutos",
    "completionRate": "Suoritusprosentti",
    "daysAllDone": "Kaikki tehty päivinä",
    "totalCompletions": "Suorituksia yhteensä",
    "tasksCompleted": "Tehtäviä suoritettu",
    "tasksCreated": "Tehtäviä luotu",
    "listsUpdated": "Listoja päivitetty"
  },
  "share": {
    "share": "Jaa",
    "sharing": "Jaetaan...",
    "close": "Sulje",
    "shareError": "Raportin jakaminen epäonnistui",
    "minFeature": "Vähintään yksi ominaisuus vaaditaan",
    "showOnCard": "Näytä kortissa"
  },
  "presets": {
    "weekly": "Viikkoraportti",
    "monthly": "Kuukausiraportti"
  }
}
```

### Update `locales/en/sessions.json`

Add: `"reports": "Reports"`

### Update `locales/fi/sessions.json`

Add: `"reports": "Raportit"`

### Update `locales/en/feed.json`

Add: `"feed.card.types.report": "Report"`, `"feed.loadingReport": "Loading report..."`, `"feed.reportError": "Failed to load report"`

### Update `locales/fi/feed.json`

Add: `"feed.card.types.report": "Raportti"`, `"feed.loadingReport": "Ladataan raporttia..."`, `"feed.reportError": "Raportin lataaminen epäonnistui"`

### Update locale index files

Add `reports` namespace to `locales/en/index.ts` and `locales/fi/index.ts`.

---

## Files Summary

| Action     | File                                                              |
| ---------- | ----------------------------------------------------------------- |
| **Create** | `supabase/migrations/20260305210000_add_reports.sql`              |
| **Create** | `supabase/functions/generate-reports/index.ts`                    |
| **Create** | `types/report.ts`                                                 |
| **Create** | `database/reports/get-report-schedules.ts`                        |
| **Create** | `database/reports/save-report-schedule.ts`                        |
| **Create** | `database/reports/update-report-schedule.ts`                      |
| **Create** | `database/reports/delete-report-schedule.ts`                      |
| **Create** | `database/reports/get-generated-report.ts`                        |
| **Create** | `features/reports/hooks/useReportSchedules.ts`                    |
| **Create** | `features/reports/hooks/useSaveReportSchedule.ts`                 |
| **Create** | `features/reports/hooks/useUpdateReportSchedule.ts`               |
| **Create** | `features/reports/hooks/useDeleteReportSchedule.ts`               |
| **Create** | `features/reports/hooks/useGeneratedReport.ts`                    |
| **Create** | `features/reports/components/ReportScheduleCard.tsx`              |
| **Create** | `features/reports/components/FeatureCheckbox.tsx`                 |
| **Create** | `features/reports/components/SchedulePicker.tsx`                  |
| **Create** | `features/reports/components/ReportSection.tsx`                   |
| **Create** | `features/reports/components/ReportShareModal.tsx`                |
| **Create** | `features/reports/components/ReportShareCard.tsx`                 |
| **Create** | `features/reports/cards/report-feed.tsx`                          |
| **Create** | `features/reports/cards/report-expanded.tsx`                      |
| **Create** | `app/reports/index.tsx`                                           |
| **Create** | `app/reports/create.tsx`                                          |
| **Create** | `locales/en/reports.json`                                        |
| **Create** | `locales/fi/reports.json`                                        |
| **Edit**   | `features/feed-cards/FeedCard.tsx` — add reports case             |
| **Edit**   | `features/feed/SessionFeed.tsx` — add expanded report view        |
| **Edit**   | `features/feed/hooks/useDeleteSession.ts` — handle reports type   |
| **Edit**   | `app/sessions/index.tsx` — add reports link                       |
| **Edit**   | `locales/en/sessions.json` — add reports translation              |
| **Edit**   | `locales/fi/sessions.json` — add reports translation              |
| **Edit**   | `locales/en/feed.json` — add report feed translations             |
| **Edit**   | `locales/fi/feed.json` — add report feed translations             |
| **Edit**   | `locales/en/index.ts` — register reports namespace                |
| **Edit**   | `locales/fi/index.ts` — register reports namespace                |

---

## Verification

1. **Create schedule**: Sessions → Reports → Create Report → fill title "Weekly Report", select Gym + Weight, frequency Weekly, Monday, 8:00 → Save → schedule appears in list
2. **Preset quick-add**: Tap "Weekly Report" quick-add → form pre-filled with defaults → Save
3. **Max limit**: Create 5 schedules → "Create Report" button disabled, count shows 5/5
4. **Edit schedule**: Tap Edit on a schedule → change title + features → Save → changes reflected
5. **Delete schedule**: Tap Delete → confirm → schedule removed from list, count decreases
6. **Report generation** (manual test): Trigger the Edge Function manually → generated report appears in DB → feed item created
7. **Feed card**: Report card shows in feed with title, date range, and feature summary
8. **Expand report**: Tap Details on report card → expanded view shows full stats per feature
9. **Share report**: Tap Share in expanded view → share modal opens with feature toggle chips → toggle features on/off → card preview updates → share → native share sheet opens
10. **Push notification**: When report generates → push notification received with correct title
11. **Empty states**: No schedules → shows empty state message. Feature with no data in period → shows zeros gracefully
12. **Translations**: Switch language to Finnish → all text shows in Finnish with proper ä/ö characters
13. **Monthly schedule**: Create monthly report on day 1 → verify it shows correct delivery info
14. **Data period**: Create report with 90-day period → expanded report shows 90 days of aggregated data
15. **Delivery time**: Create report with delivery time 18:00 → verify `delivery_hour` stored as correct UTC value → cron triggers only at matching hour
