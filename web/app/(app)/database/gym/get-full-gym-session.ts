import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";
import { full_gym_session } from "@/app/(app)/types/models";

export async function getFullGymSession(sessionId: string) {
  const supabase = createClient();

  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const { data: gymSession, error: gymSessionError } = await supabase
    .from("sessions")
    .select(`*, gym_session_exercises(*, gym_exercises(*), gym_sets(*))`)
    .order("position", {
      referencedTable: "gym_session_exercises",
      ascending: true,
    })
    .eq("id", sessionId)
    .single<full_gym_session>();

  gymSession?.gym_session_exercises.forEach((exercise) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets.sort((a, b) => a.set_number - b.set_number);
    }
  });

  if (gymSessionError || !gymSession) {
    console.log("error fetching gym session", gymSessionError);
    handleError(gymSessionError, {
      message: "Error fetching gym session",
      route: "/database/gym/get-full-gym-session",
      method: "GET",
    });
    throw new Error("Error fetching gym session");
  }

  return gymSession;
}
