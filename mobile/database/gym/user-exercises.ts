import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getUserExercises() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error fetching user exercises",
      route: "/database/gym/edit-exercise",
      method: "GET",
    });
    throw new Error("Error fetching user exercises");
  }

  return exercises;
}
