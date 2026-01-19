import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type Exercise = {
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function addExercise({
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: Exercise) {

  const { error } = await supabase
    .from("gym_exercises")
    .insert([
      {
        name,
        language,
        equipment,
        muscle_group,
        main_group,
      },
    ])
    .select()
    .single();


  if (error) {
    handleError(error, {
      message: "Error adding new exercise",
      route: "/database/gym/add-exercise",
      method: "POST",
    });
    throw new Error("Error adding new exercise");
  }

  return { success: true };
}
