import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";


export default async function DeleteExercise(item_id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .delete()
    .eq("id", item_id);

  if (error) {
    handleError(error, {
      message: "Error deleting exercise",
      route: "/api/gym/delete-exercise",
      method: "DELETE",
    });
    throw new Error(error.message);
  }

  return { success: true };
}
