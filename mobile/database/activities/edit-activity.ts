import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Activity = {
  name: string;
  category_id: string;
  id: string;
};

export async function editActivity({ name, category_id, id }: Activity) {
  const { error } = await supabase
    .from("activities")
    .update({
      name,
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
