import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullActivitySession(sessionId: string) {
  const { data: activitySession, error: activitySessionError } = await supabase
    .from("activity_session")
    .select("*")
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
