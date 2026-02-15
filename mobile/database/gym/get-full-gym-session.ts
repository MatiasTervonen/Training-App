import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";

export async function getFullGymSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const language = useUserStore.getState().settings?.language ?? "en";

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `*, gym_session_exercises(
        *,
        gym_exercises(
          *,
          gym_exercises_translations!inner(name)
        ),
        gym_sets(*)
      )`,
    )
    .eq(
      "gym_session_exercises.gym_exercises.gym_exercises_translations.language",
      language,
    )
    .order("position", {
      referencedTable: "gym_session_exercises",
      ascending: true,
    })
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    console.error("Error fetching gym session:", error);
    handleError(error, {
      message: "Error fetching gym session",
      route: "/database/gym/get-full-gym-session",
      method: "GET",
    });
    throw new Error("Error fetching gym session");
  }

  // Map the result to extract translated name from gym_exercises_translations
  data.gym_session_exercises = data.gym_session_exercises.map(
    (exercise: any) => ({
      ...exercise,
      gym_exercises: {
        ...exercise.gym_exercises,
        name:
          exercise.gym_exercises?.gym_exercises_translations?.[0]?.name ??
          "Unknown",
      },
    }),
  );

  data.gym_session_exercises.forEach((exercise: any) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets = [...exercise.gym_sets].sort(
        (a: { set_number: number }, b: { set_number: number }) =>
          a.set_number - b.set_number,
      );
    }
  });

  return data;
}

export type FullGymSession = NonNullable<
  Awaited<ReturnType<typeof getFullGymSession>>
>;
