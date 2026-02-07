import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

type SessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  gym_exercises: {
    main_group: string;
    name: string;
    equipment: string;
    gym_exercises_translations: { name: string; language: string }[];
  };
  sessions: { created_at: string; user_id: string };
};

export async function getLastExerciseHistory({
  exerciseId,
  language = "en",
}: {
  exerciseId: string;
  language?: string;
}) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error: exerciseError } = await supabase
    .from("gym_session_exercises")
    .select(
      `
      id,
      session_id,
      exercise_id,
      gym_exercises(main_group, name, equipment, gym_exercises_translations(name, language)),
      sessions!inner(created_at, user_id)
      `,
    )
    .eq("exercise_id", exerciseId)
    .eq("sessions.user_id", user.sub);

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error fetching exercise history",
      route: "/database/gym/last-exercise-history/[exerciseId]",
      method: "GET",
    });
    throw new Error("Error fetching exercise history");
  }

  const sessions = exercises as unknown as SessionExercise[] | null;

  if (!sessions || sessions.length === 0) {
    return [];
  }

  if (exerciseError) {
    handleError(exerciseError, {
      message: "Error fetching exercise history",
      route: "/database/gym/last-exercise-history",
      method: "GET",
    });
    throw new Error("Error fetching exercise history");
  }

  const sorted = sessions.sort(
    (a, b) =>
      new Date(b.sessions.created_at || 0).getTime() -
      new Date(a.sessions.created_at || 0).getTime(),
  );

  const allSorted = await Promise.all(
    sorted.map(async (session) => {
      const { data: sets, error: setsError } = await supabase
        .from("gym_sets")
        .select("set_number,weight, reps, rpe, time_min, distance_meters")
        .eq("session_exercise_id", session.id)
        .order("set_number", { ascending: true });

      if (setsError) {
        console.error("Error fetching sets:", setsError);
        handleError(setsError, {
          message: "Error fetching sets",
          route: "/database/gym/last-exercise-history",
          method: "GET",
        });
        throw new Error("Error fetching sets");
      }

      const translatedName =
        session.gym_exercises.gym_exercises_translations.find(
          (t) => t.language === language,
        )?.name ?? session.gym_exercises.name;

      return {
        date: session.sessions.created_at,
        main_group: session.gym_exercises.main_group,
        name: translatedName,
        equipment: session.gym_exercises.equipment,
        sets,
      };
    }),
  );

  const filteredResults = allSorted.filter(Boolean);

  return filteredResults;
}
