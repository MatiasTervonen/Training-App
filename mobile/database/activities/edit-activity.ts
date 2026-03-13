import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  base_met: number;
  category_id: string;
  id: string;
  is_gps_relevant: boolean;
  is_step_relevant: boolean;
  is_calories_relevant: boolean;
};

export async function editActivity({
  name,
  base_met,
  category_id,
  id,
  is_gps_relevant,
  is_step_relevant,
  is_calories_relevant,
}: Activity) {
  const { error } = await supabase
    .from("activities")
    .update({
      name,
      base_met,
      category_id,
      is_gps_relevant,
      is_step_relevant,
      is_calories_relevant,
    })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error editing activity",
      route: "/database/activities/edit-activity",
      method: "POST",
    });
    throw new Error("Error editing activity");
  }

  return { success: true };
}
