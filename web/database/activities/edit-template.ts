import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type Template = {
  name: string;
  notes: string;
  id: string;
  activityId: string;
};

export async function editTemplate({ name, notes, id, activityId }: Template) {
  const supabase = createClient();

  const updatedAt = new Date().toISOString();

  const { error } = await supabase
    .from("activity_templates")
    .update({
      name,
      notes,
      activity_id: activityId,
      updated_at: updatedAt,
    })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error editing activity template",
      route: "/database/activities/edit-template",
      method: "POST",
    });
    throw new Error("Error editing activity template");
  }

  return { success: true };
}
