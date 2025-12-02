import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";


export default async function DeleteExercise(item_id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .delete()
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
