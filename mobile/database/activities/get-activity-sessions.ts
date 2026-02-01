import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getActivitySessions(days: number = 90) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("sessions")
    .select("id, created_at, activities(name, slug)")
    .eq("user_id", session.user.id)
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

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    activity_name: row.activities?.name ?? null,
    activity_slug: row.activities?.slug ?? null,
  }));
}
