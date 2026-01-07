import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullActivitySession(sessionId: string) {
  const { data: activitySession, error: activitySessionError } = await supabase
    .from("activity_sessions")
    .select(
      "*, activities (*), activity_session_stats(*), activity_gps_points(*)"
    )
    .order("recorded_at", {
      ascending: true,
      referencedTable: "activity_gps_points",
    })
    .eq("id", sessionId)
    .single();

  if (activitySessionError || !activitySession) {
    handleError(activitySessionError, {
      message: "Error fetching activity session",
      route: "/database/activities/get-full-activity-session",
      method: "GET",
    });

    throw new Error("Error fetching activity session");
  }

  return activitySession;
}
