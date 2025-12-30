import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

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
  const supabase = createClient();

  const {
    data,
    error: authError,
  } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, language, equipment, muscle_group, main_group })
    .eq("id", id)
    .eq("user_id", user.sub);

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
