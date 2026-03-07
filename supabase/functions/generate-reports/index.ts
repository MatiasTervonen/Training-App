import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Verify the request is from our cron job using the secret key
  // SUPABASE_SERVICE_ROLE_KEY is the legacy env var name but contains the current secret key value
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

  const now = new Date();

  // Get all active schedules where the current hour matches in the user's timezone
  // We fetch all active schedules and filter in code because each schedule may have a different timezone
  const { data: schedules, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("is_active", true);

  if (error || !schedules) {
    return new Response(JSON.stringify({ error: "Failed to fetch schedules" }), {
      status: 500,
    });
  }

  // Filter schedules that match the current day+hour in their timezone
  const matchingSchedules = schedules.filter((schedule) => {
    const tz = schedule.timezone || "UTC";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hourCycle: "h23",
    });
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      day: "numeric",
    });

    const localHour = Number(formatter.format(now));
    const localParts = dayFormatter.formatToParts(now);
    const localDayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .indexOf(localParts.find((p) => p.type === "weekday")!.value);
    const localDayOfMonth = Number(localParts.find((p) => p.type === "day")!.value);

    if (schedule.delivery_hour !== localHour) return false;

    if (schedule.schedule_type === "weekly" || schedule.schedule_type === "biweekly") {
      return schedule.delivery_day_of_week === localDayOfWeek;
    }
    if (schedule.schedule_type === "monthly" || schedule.schedule_type === "quarterly") {
      return schedule.delivery_day_of_month === localDayOfMonth;
    }
    return false;
  });

  // Map schedule_type to data period in days
  const periodDaysMap: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
  };

  for (const schedule of matchingSchedules) {
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
            (now.getTime() - new Date(lastReport.created_at).getTime()) / (1000 * 60 * 60 * 24),
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
            (now.getTime() - new Date(lastReport.created_at).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceLast < 85) continue; // Skip — too soon (allow 5 day tolerance)
        }
      }

      const dataPeriodDays = periodDaysMap[schedule.schedule_type] || 7;
      const tz = schedule.timezone || "UTC";

      // Calculate period dates in the user's local timezone
      const localDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now); // "YYYY-MM-DD" in user's timezone

      // periodEnd = yesterday in user's timezone
      const localToday = new Date(localDateStr + "T00:00:00Z");
      const periodEnd = new Date(localToday);
      periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);
      const periodStart = new Date(periodEnd);
      periodStart.setUTCDate(periodStart.getUTCDate() - dataPeriodDays + 1);

      const reportData = await aggregateReportData(
        supabase,
        schedule.user_id,
        schedule.included_features,
        periodStart,
        periodEnd,
        tz,
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

  return new Response(JSON.stringify({ processed: matchingSchedules.length }), {
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
  timezone: string,
) {
  const start = formatDate(periodStart);
  const end = formatDate(periodEnd);

  // PostgreSQL natively parses IANA timezone names in timestamp literals
  const tsStart = `${start} 00:00:00 ${timezone}`;
  const tsEnd = `${end} 23:59:59 ${timezone}`;

  const data: Record<string, unknown> = {};

  for (const feature of features) {
    switch (feature) {
      case "gym": {
        // Gym sessions = sessions that have gym_session_exercises
        const { data: gymExerciseRows, error: exErr } = await supabase
          .from("gym_session_exercises")
          .select("session_id")
          .eq("user_id", userId);

        if (exErr) console.error("gym_session_exercises query failed:", exErr.message);

        const gymSessionIds = [
          ...new Set((gymExerciseRows || []).map((r: { session_id: string }) => r.session_id)),
        ];

        let gymSessions: { id: string; duration: number | null; session_stats: { total_volume: number; calories: number } | null }[] = [];
        if (gymSessionIds.length > 0) {
          const { data: sessions, error: sessErr } = await supabase
            .from("sessions")
            .select("id, duration, start_time, session_stats(total_volume, calories)")
            .eq("user_id", userId)
            .in("id", gymSessionIds)
            .gte("start_time", tsStart)
            .lte("start_time", tsEnd);

          if (sessErr) console.error("sessions query failed:", sessErr.message);
          console.log(`gym: ${gymSessionIds.length} exercise session IDs, range ${tsStart} to ${tsEnd}, found ${sessions?.length ?? 0} sessions`);
          gymSessions = sessions || [];
        }

        const totalDuration = gymSessions.reduce((sum: number, s) => sum + (s.duration || 0), 0);
        const totalVolume = gymSessions.reduce(
          (sum: number, s) => sum + (s.session_stats?.total_volume || 0),
          0,
        );
        const totalCalories = gymSessions.reduce(
          (sum: number, s) => sum + (s.session_stats?.calories || 0),
          0,
        );

        const filteredIds = gymSessions.map((s) => s.id);
        let exerciseCount = 0;
        if (filteredIds.length > 0) {
          const { count } = await supabase
            .from("gym_session_exercises")
            .select("id", { count: "exact", head: true })
            .in("session_id", filteredIds);
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
        // Activity sessions = sessions that do NOT have gym_session_exercises
        const { data: allSessions } = await supabase
          .from("sessions")
          .select("id, duration, start_time, session_stats(calories, steps, distance_meters)")
          .eq("user_id", userId)
          .gte("start_time", tsStart)
          .lte("start_time", tsEnd);

        const allSessionsList = allSessions || [];
        const allIds = allSessionsList.map((s: { id: string }) => s.id);

        // Find which of these have gym exercises (to exclude them)
        let gymIds = new Set<string>();
        if (allIds.length > 0) {
          const { data: gymRows } = await supabase
            .from("gym_session_exercises")
            .select("session_id")
            .in("session_id", allIds);
          gymIds = new Set((gymRows || []).map((r: { session_id: string }) => r.session_id));
        }

        const actSessions = allSessionsList.filter((s: { id: string }) => !gymIds.has(s.id));
        const totalDuration = actSessions.reduce((sum: number, s: { duration: number | null }) => sum + (s.duration || 0), 0);
        const totalDistance = actSessions.reduce(
          (sum: number, s: { session_stats: { distance_meters: number } | null }) => sum + (s.session_stats?.distance_meters || 0),
          0,
        );
        const totalCalories = actSessions.reduce(
          (sum: number, s: { session_stats: { calories: number } | null }) => sum + (s.session_stats?.calories || 0),
          0,
        );
        const totalSteps = actSessions.reduce(
          (sum: number, s: { session_stats: { steps: number } | null }) => sum + (s.session_stats?.steps || 0),
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
          .gte("created_at", tsStart)
          .lte("created_at", tsEnd)
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
        const { data: logs, error: logErr } = await supabase
          .from("habit_logs")
          .select("habit_id, completed_date")
          .eq("user_id", userId)
          .gte("completed_date", start)
          .lte("completed_date", end);

        if (logErr) console.error("habit_logs query failed:", logErr.message);

        const { data: habits, error: habErr } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (habErr) console.error("habits query failed:", habErr.message);
        console.log(`habits: ${logs?.length ?? 0} logs, ${habits?.length ?? 0} active habits, range ${start} to ${end}`);

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
        const { count: completedTasks } = await supabase
          .from("todo_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_completed", true)
          .gte("updated_at", tsStart)
          .lte("updated_at", tsEnd);

        const { count: createdTasks } = await supabase
          .from("todo_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", tsStart)
          .lte("created_at", tsEnd);

        const { count: updatedLists } = await supabase
          .from("todo_lists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("updated_at", tsStart)
          .lte("updated_at", tsEnd);

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
