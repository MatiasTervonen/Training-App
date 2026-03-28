import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getActivitySessions(days: number = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, created_at, activities(name, slug), session_stats(distance_meters)",
    )
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching activity sessions",
      route: "/database/activities/get-activity-sessions",
      method: "getActivitySessions",
    });
    throw new Error("Failed to fetch activity sessions.");
  }

  return (data ?? []).map((row) => {
    const stats = Array.isArray(row.session_stats)
      ? row.session_stats[0]
      : row.session_stats;
    return {
      id: row.id,
      created_at: row.created_at,
      activity_name: row.activities?.name ?? null,
      activity_slug: row.activities?.slug ?? null,
      distance_meters: stats?.distance_meters ?? null,
    };
  });
}
