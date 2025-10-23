import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default async function GetUserExercises() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select("id, user_id, name, equipment, muscle_group, main_group, language")
    .order("name", { ascending: true })
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error fetching user exercises",
      route: "/api/gym/edit-exercise",
      method: "GET",
    });
    throw new Error(error.message);
  }

  return exercises;
}
