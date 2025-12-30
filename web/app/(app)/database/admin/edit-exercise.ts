"use server";

import { createClient } from "@/utils/supabase/server";
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
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, language, equipment, muscle_group, main_group })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating exercise",
      route: "server-action: editExercise-Admin",
      method: "direct",
    });
    throw new Error("Error updating exercise");
  }

  return { success: true };
}
