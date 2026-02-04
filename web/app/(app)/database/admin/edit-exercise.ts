"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type Exercise = {
  id: string;
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export async function editExercise({
  id,
  name,
  equipment,
  muscle_group,
  main_group,
}: Exercise) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

    // Check if the user has admin privileges
    const role = user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      throw new Error("Forbidden");
    }

  const { error } = await supabase
    .from("gym_exercises")
    .update({ name, equipment, muscle_group, main_group })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating exercise",
      route: "server-action: editExercise-Admin",
      method: "direct",
    });
    throw new Error("Error updating exercise");
  }

  return { success: true };
}
