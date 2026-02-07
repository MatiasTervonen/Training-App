import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveActivityParams = {
  title: string;
  notes: string;
  duration: number;
  start_time: string;
  end_time: string;
  activityId: string;
};

export async function saveActivitySession({
  title,
  notes,
  duration,
  start_time,
  end_time,
  activityId,
}: SaveActivityParams) {
  const supabase = createClient();

  const { data: sessionId, error } = await supabase.rpc(
    "activities_save_activity",
    {
      p_title: title,
      p_notes: notes,
      p_duration: duration,
      p_start_time: start_time,
      p_end_time: end_time,
      p_track: [],
      p_activity_id: activityId,
      p_steps: 0,
    }
  );

  if (error || !sessionId) {
    handleError(error, {
      message: "Error saving activity session",
      route: "/database/activities/save-activity-session",
      method: "POST",
    });
    throw new Error("Error saving activity session");
  }

  return { success: true };
}
