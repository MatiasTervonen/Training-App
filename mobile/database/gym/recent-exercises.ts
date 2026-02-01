import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";

export async function getRecentExercises() {
  const language = useUserStore.getState().settings?.language ?? "en";

  const { data, error } = await supabase
    .from("gym_session_exercises")
    .select(
      `
      exercise:exercise_id (
        id,
        equipment,
        main_group,
        muscle_group,
        gym_exercises_translations(name)
      )
      `,
    )
    .eq("exercise.gym_exercises_translations.language", language)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    handleError(error, {
      message: "Error fetching recent exercises",
      route: "/database/gym/recent-exercises",
      method: "GET",
    });
    throw new Error("Error fetching recent exercises");
  }

  const uniqueExercises = [];
  const seen = new Set();

  for (const row of data || []) {
    const ex = row.exercise;

    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);

      uniqueExercises.push({
        id: ex.id,
        equipment: ex.equipment,
        main_group: ex.main_group,
        muscle_group: ex.muscle_group,
        name: ex.gym_exercises_translations[0]?.name ?? "Unknown",
      });
    }
    if (uniqueExercises.length >= 10) break;
  }

  return uniqueExercises;
}
