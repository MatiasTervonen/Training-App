import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  base_met: number;
  category_id: string;
  is_gps_relevant: boolean;
  is_step_relevant: boolean;
  is_calories_relevant: boolean;
};

export async function addActivity({ name, base_met, category_id, is_gps_relevant, is_step_relevant, is_calories_relevant }: Activity) {
  const { error } = await supabase
    .from("activities")
    .insert([
      {
        name,
        base_met,
        category_id,
        is_gps_relevant,
        is_step_relevant,
        is_calories_relevant,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding new activity:", error);
    handleError(error, {
      message: "Error adding new activity",
      route: "/database/activities/add-activity",
      method: "POST",
    });
    throw new Error("Error adding new activity");
  }

  return { success: true };
}
