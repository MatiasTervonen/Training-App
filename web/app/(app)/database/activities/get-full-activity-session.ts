import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";
import { FullActivitySession } from "@/app/(app)/types/models";

export async function getFullActivitySession(
  sessionId: string,
): Promise<FullActivitySession> {
  const supabase = createClient();

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

  return data as FullActivitySession;
}
