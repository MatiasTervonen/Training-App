import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullActivitySession(sessionId: string) {
  const { data, error } = await supabase.rpc("activities_get_full_session", {
    p_session_id: sessionId,
  });

  if (error || !data) {
    handleError(error, {
      message: "Error fetching activity session",
      route: "/database/activities/get-full-activity-session",
      method: "GET",
    });
    throw new Error("Error fetching activity session");
  }

  console.log("data", data);

  return data;
}
