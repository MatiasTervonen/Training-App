import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getExercises() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { data, error } = await supabase
    .from("gym_exercises")
    .select("id, user_id, name, equipment, muscle_group, main_group, created_at, language")
    .order("name", { ascending: true });

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/api/gym/get-exercises",
      method: "GET",
    });
    throw error;
  }

  return data ?? [];
}
