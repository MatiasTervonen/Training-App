"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveExerciserops = {
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function saveExercise({
  name,
  language,
  equipment,
  muscle_group,
  main_group,
}: SaveExerciserops) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: existingExercise, error: fetchError } = await supabase
    .from("gym_exercises")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (fetchError) {
    handleError(fetchError, {
      message: "Error checking existing exercise",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error checking existing exercise");
  }

  if (existingExercise) {
    throw new Error("Exercise with this name already exists.");
  }

  const { error: exerciseError } = await supabase
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

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error adding new exercise");
  }

  return { success: true };
}
