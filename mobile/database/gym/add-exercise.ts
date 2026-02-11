import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .insert([
      {
        name,
        equipment,
        muscle_group,
        main_group,
        user_id: session.user.id,
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
