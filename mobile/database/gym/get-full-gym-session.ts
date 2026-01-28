import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullGymSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data, error } = await supabase
    .from("sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
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

  data.gym_session_exercises.forEach((exercise) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets.sort((a, b) => a.set_number - b.set_number);
    }
  });

  return data;
}

export type FullGymSession = NonNullable<
  Awaited<ReturnType<typeof getFullGymSession>>
>;
