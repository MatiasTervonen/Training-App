import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteExercise(item_id: string) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .delete()
    .eq("user_id", user.sub)
    .eq("id", item_id);

  if (error) {
    handleError(error, {
      message: "Error deleting exercise",
      route: "/database/gym/delete-exercise",
      method: "DELETE",
    });
    throw new Error("Error deleting exercise");
  }

  return { success: true };
}
