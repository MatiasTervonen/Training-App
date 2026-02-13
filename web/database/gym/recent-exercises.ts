import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";
import { ExerciseWithTranslation } from "@/database/gym/get-exercises";

export async function getRecentExercises(): Promise<ExerciseWithTranslation[]> {
  const supabase = createClient();
  const language = useUserStore.getState().preferences?.language ?? "en";

  const { data: exercises, error } = await supabase
    .from("gym_session_exercises")
    .select(
      `
      exercise:exercise_id (
        id,
        equipment,
        main_group,
        muscle_group,
        gym_exercises_translations!inner(name)
      )
    `
    )
    .eq("exercise.gym_exercises_translations.language", language)
    .order("id", { ascending: false })
    .limit(10);

  if (error) {
    handleError(error, {
      message: "Error fetching recent exercises",
      route: "/database/gym/recent-exercises",
      method: "GET",
    });
    throw new Error("Error fetching recent exercises");
  }

  const uniqueExercises: ExerciseWithTranslation[] = [];
  const seen = new Set<string>();

  for (const row of exercises ?? []) {
    const ex = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      uniqueExercises.push({
        id: ex.id,
        equipment: ex.equipment,
        main_group: ex.main_group,
        muscle_group: ex.muscle_group,
        name:
          (ex.gym_exercises_translations as { name: string }[])?.[0]?.name ??
          "Unknown",
      });
    }
  }

  return uniqueExercises;
}
