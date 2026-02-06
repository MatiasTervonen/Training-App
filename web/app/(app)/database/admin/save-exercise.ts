"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveExerciserops = {
  name: string;
  fiName: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function saveExercise({
  name,
  fiName,
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

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
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

  const { data: exercise, error: exerciseError } = await supabase
    .from("gym_exercises")
    .insert([
      {
        name,
        equipment,
        muscle_group,
        main_group,
      },
    ])
    .select("id")
    .single();

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error adding new exercise");
  }

  const { error: translationError } = await supabase
    .from("gym_exercises_translations")
    .insert([
      { exercise_id: exercise.id, language: "en", name: name },
      { exercise_id: exercise.id, language: "fi", name: fiName },
    ]);

  if (translationError) {
    handleError(translationError, {
      message: "Error adding exercise translation",
      route: "server-action: saveExerciseToDB-Admin",
      method: "direct",
    });
    throw new Error("Error adding exercise translation");
  }

  return { success: true };
}
