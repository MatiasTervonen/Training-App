import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { LatestHistoryPerExercise } from "@/types/session";

export async function getPrefetchedHistoryPerCard(
  exerciseIds: string[]
): Promise<LatestHistoryPerExercise[]> {
  const { data, error } = await supabase.rpc(
    "gym_latest_history_per_exercise",
    {
      exercise_ids: exerciseIds,
    }
  );

  if (error) {
    handleError(error, {
      message: "Error fetching latest history per exercise",
      route: "/database/gym/prefetchedHistoryPerCard",
      method: "GET",
    });
    throw new Error("Error fetching latest history per exercise");
  }

  return data as LatestHistoryPerExercise[];
}
