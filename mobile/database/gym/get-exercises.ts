import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getExercises() {
  const language = useUserStore.getState().settings?.language ?? "en";

  // Fetch translated (base) exercises
  const { data: translatedData, error: translatedError } = await supabase
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

  if (translatedError) {
    handleError(translatedError, {
      message: "Error fetching exercises",
      route: "/database/gym/get-exercises",
      method: "GET",
    });
    throw new Error("Error fetching exercises");
  }

  // Fetch user-created exercises (no translations)
  const { data: userData, error: userError } = await supabase
    .from("gym_exercises")
    .select("id, name, equipment, main_group, muscle_group")
    .not("user_id", "is", null);

  if (userError) {
    handleError(userError, {
      message: "Error fetching user exercises",
      route: "/database/gym/get-exercises",
      method: "GET",
    });
    throw new Error("Error fetching user exercises");
  }

  const translatedExercises =
    translatedData?.map((exercise) => ({
      ...exercise,
      name: exercise.gym_exercises_translations[0]?.name ?? "Unknown",
    })) ?? [];

  const userExercises =
    userData?.filter(
      (ue) => !translatedExercises.some((te) => te.id === ue.id),
    ) ?? [];

  const exercises = [...translatedExercises, ...userExercises];

  // Sort by name
  return exercises.sort((a, b) => a.name.localeCompare(b.name));
}
