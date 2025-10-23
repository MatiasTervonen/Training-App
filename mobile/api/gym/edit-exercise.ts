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

export default async function EditExercise({
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
    throw new Error("No session");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, language, equipment, muscle_group, main_group })
    .eq("id", id)
    .eq("user_id", session.user.id)


  if (error) {
    handleError(error, {
      message: "Error updating exercise",
      route: "/api/gym/edit-exercise",
      method: "POST",
    });
    throw new Error(error.message);
  }

  return { success: true };
}
