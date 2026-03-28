import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type ExerciseBestE1rm = {
  exercise_id: string;
  best_e1rm: number;
};

export async function getExerciseBestE1rm(
  exerciseIds: string[],
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("gym_get_exercise_best_e1rm", {
    exercise_ids: exerciseIds,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching exercise best e1rm",
      route: "/database/gym/getExerciseBestE1rm",
      method: "GET",
    });
    throw new Error("Error fetching exercise best e1rm");
  }

  const result: Record<string, number> = {};
  for (const row of (data as ExerciseBestE1rm[]) ?? []) {
    result[row.exercise_id] = Number(row.best_e1rm);
  }
  return result;
}
