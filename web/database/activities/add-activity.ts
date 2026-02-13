import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  base_met: number;
  category_id: string;
};

export async function addActivity({ name, base_met, category_id }: Activity) {
  const supabase = createClient();

  const { error } = await supabase
    .from("activities")
    .insert([
      {
        name,
        base_met,
        category_id,
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
