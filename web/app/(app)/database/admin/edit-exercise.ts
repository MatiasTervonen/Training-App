"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type Exercise = {
  id: string;
  name: string;
  fiName: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function editExercise({
  id,
  name,
  fiName,
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

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, equipment, muscle_group, main_group })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating exercise",
      route: "server-action: editExercise-Admin",
      method: "direct",
    });
    throw new Error("Error updating exercise");
  }

  const { error: translationError } = await supabase
    .from("gym_exercises_translations")
    .upsert(
      [
        { exercise_id: id, language: "en", name },
        { exercise_id: id, language: "fi", name: fiName },
      ],
      { onConflict: "exercise_id,language" },
    );

  if (translationError) {
    handleError(translationError, {
      message: "Error updating exercise translations",
      route: "server-action: editExercise-Admin",
      method: "direct",
    });
    throw new Error("Error updating exercise translations");
  }

  return { success: true };
}
