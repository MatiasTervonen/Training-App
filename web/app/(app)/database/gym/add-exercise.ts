import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type Exercise = {
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function addExercise({
  name,
  equipment,
  muscle_group,
  main_group,
}: Exercise) {
  const supabase = createClient();

  const { error: exerciseError } = await supabase
    .from("gym_exercises")
    .insert([
      {
        name,
        equipment,
        muscle_group,
        main_group,
      },
    ])
    .select()
    .single();

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "/database/gym/add-exercise",
      method: "POST",
    });
    throw new Error("Error adding new exercise");
  }

  return { success: true };
}
