import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteActivity(activityId: string) {

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error) {
    handleError(error, {
      message: "Error deleting activity",
      route: "/database/activities/delete-activity",
      method: "DELETE",
    });
    throw new Error("Error deleting activity");
  }

  return { success: true };
}
