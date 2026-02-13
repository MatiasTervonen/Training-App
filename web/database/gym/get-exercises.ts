import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";

export type ExerciseWithTranslation = {
  id: string;
  equipment: string;
  main_group: string;
  muscle_group: string;
  name: string;
};

export async function getExercises(): Promise<ExerciseWithTranslation[]> {
  const supabase = createClient();

  const language = useUserStore.getState().preferences?.language ?? "en";

  const { data, error } = await supabase
    .from("gym_exercises")
    .select(
      `
      id,
      equipment,
      main_group,
      muscle_group,
      gym_exercises_translations!inner(name)
  
  `,
    )
    .eq("gym_exercises_translations.language", language);

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/database/gym/get-exercises",
      method: "GET",
    });
    throw new Error("Error fetching exercises");
  }

  const exercises =
    data?.map((exercise) => ({
      ...exercise,
      name: exercise.gym_exercises_translations[0]?.name ?? "Unknown",
    })) ?? [];

  // Sort by name
  exercises.sort((a, b) => a.name.localeCompare(b.name));

  return exercises;
}
