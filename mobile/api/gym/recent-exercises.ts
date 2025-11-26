import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ExercisePreview } from "@/types/models";

export async function getRecentExercises() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }
  const { data: exercises, error } = await supabase
    .from("gym_session_exercises")
    .select(
      `exercise:exercise_id (id, user_id, name, equipment, muscle_group, main_group, created_at, language)`
    )
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
