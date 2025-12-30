import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";
import { ExercisePreview } from "@/app/(app)/types/models";

export async function getRecentExercises() {
  const supabase = createClient();

  const { data: exercises, error } = await supabase
    .from("gym_session_exercises")
    .select(`exercise:exercise_id (*)`)
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

  const uniqueExercises: ExercisePreview[] = [];
  const seen = new Set<number>();

  for (const row of exercises) {
    const ex = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      uniqueExercises.push(ex);
    }
  }

  return uniqueExercises ?? [];
}
