import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type editActivity = {
  title: string;
  notes: string;
  id: string;
  activityId: string;
};

export async function editActivitySession({
  title,
  notes,
  id,
  activityId,
}: editActivity) {
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase.rpc("activity_edit_activity_session", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_activity_id: activityId,
    p_updated_at: updatedAt,
  });

  if (error) {
    console.error("Error editing activity session:", error);
    handleError(error, {
      message: "Error editing activity session",
      route: "/database/activities/edit-session",
      method: "POST",
    });
    throw new Error("Error editing activity session");
  }

  return data;
}
