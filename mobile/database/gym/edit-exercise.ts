import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Exercise = {
  id: string;
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function editExercise({
  id,
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: Exercise) {

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, language, equipment, muscle_group, main_group })
    .eq("id", id)

  if (error) {
    handleError(error, {
      message: "Error updating exercise",
      route: "/database/gym/edit-exercise",
      method: "POST",
    });
    throw new Error("Error updating exercise");
  }

  return { success: true };
}
