"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export type ExerciseForEdit = {
  id: string;
  equipment: string;
  main_group: string;
  muscle_group: string;
  name: string;
  fiName: string;
};

export async function getFullExercise(
  exerciseId: string,
): Promise<ExerciseForEdit> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const user = authData?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { data, error } = await supabase
    .from("gym_exercises")
    .select(
      `
      id,
      equipment,
      main_group,
      muscle_group,
      gym_exercises_translations(language, name)
  `,
    )
    .eq("id", exerciseId)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/database/gym/get-exercises",
      method: "GET",
    });
    throw new Error("Error fetching exercises");
  }

  const translations = data.gym_exercises_translations;
  const enName = translations.find((t) => t.language === "en")?.name ?? "";
  const fiName = translations.find((t) => t.language === "fi")?.name ?? "";

  return {
    id: data.id,
    equipment: data.equipment,
    main_group: data.main_group,
    muscle_group: data.muscle_group,
    name: enName,
    fiName: fiName,
  };
}
