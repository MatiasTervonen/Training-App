import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type SessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  gym_sessions: { created_at: string; user_id: string }[];
};

export async function getLastExerciseHistory({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("User not authenticated");
  }

  const { data: exercises, error: exerciseError } = await supabase
    .from("gym_session_exercises")
    .select(
      "id, session_id, exercise_id, gym_sessions:session_id(created_at, user_id)"
    )
    .eq("exercise_id", exerciseId)
    .eq("gym_sessions.user_id", session.user.id);

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error fetching exercise history",
      route: "/api/gym/last-exercise-history/[exerciseId]",
      method: "GET",
    });
    throw new Error("Error fetching exercise history");
  }

  const sessions = exercises as SessionExercise[] | null;

  if (!sessions || sessions.length === 0) {
    return [];
  }

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error fetching exercise history",
      route: "/api/gym/last-exercise-history",
      method: "GET",
    });
    throw new Error("Error fetching exercise history");
  }

  const sorted = sessions.sort(
    (a, b) =>
      new Date(b.gym_sessions?.[0]?.created_at || 0).getTime() -
      new Date(a.gym_sessions?.[0]?.created_at || 0).getTime()
  );

  const allSorted = await Promise.all(
    sorted.map(async (session) => {
      const { data: sets, error: setsError } = await supabase
        .from("gym_sets")
        .select("set_number,weight, reps, rpe")
        .eq("session_exercise_id", session.id)
        .order("set_number", { ascending: true });

      if (setsError) {
        handleError(setsError, {
          message: "Error fetching sets",
          route: "/api/gym/last-exercise-history",
          method: "GET",
        });
        return null;
      }

      return {
        date: session.gym_sessions?.[0]?.created_at,
        sets,
      };
    })
  );

  const filteredResults = allSorted.filter(Boolean);

  return filteredResults;
}
