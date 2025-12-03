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

export default async function AddExercise({
  id,
  name,
  language,
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

  const { error: exerciseError } = await supabase
    .from("gym_exercises")
    .insert([
      {
        id,
        name,
        language,
        equipment,
        muscle_group,
        main_group,
        user_id: session.user.id,
      },
    ])
    .select()
    .single();

  console.log("Sending user_id:", session.user.id);

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
