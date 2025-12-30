import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getUserExercises() {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: exercises, error } = await supabase
    .from("gym_exercises")
    .select("*")
    .order("name", { ascending: true })
    .eq("user_id", user.sub);

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
