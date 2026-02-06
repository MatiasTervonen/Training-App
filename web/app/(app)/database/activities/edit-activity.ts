import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type Activity = {
  name: string;
  base_met: number;
  category_id: string;
  id: string;
};

export async function editActivity({
  name,
  base_met,
  category_id,
  id,
}: Activity) {
  const supabase = createClient();

  const { error } = await supabase
    .from("activities")
    .update({
      name,
      base_met,
      category_id,
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
