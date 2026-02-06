import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type EditActivityParams = {
  id: string;
  title: string;
  notes: string;
  activityId: string;
};

export async function editActivitySession({
  id,
  title,
  notes,
  activityId,
}: EditActivityParams) {
  const supabase = createClient();
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase.rpc("activity_edit_session", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_activity_id: activityId,
    p_updated_at: updatedAt,
  });

  if (error) {
    handleError(error, {
      message: "Error editing activity session",
      route: "/database/activities/edit-activity-session",
      method: "POST",
    });
    throw new Error("Error editing activity session");
  }

  return data;
}
