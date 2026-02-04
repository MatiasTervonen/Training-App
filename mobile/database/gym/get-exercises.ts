import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getExercises() {
  const language = useUserStore.getState().settings?.language ?? "en";

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
