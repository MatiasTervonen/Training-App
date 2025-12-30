"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function deleteExercise(item_id: string) {
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
    .delete()
    .eq("id", item_id);

  if (error) {
    handleError(error, {
      message: "Error deleting exercise",
      route: "server-action: deleteExercise-Admin",
      method: "direct",
    });
    throw new Error("Error deleting exercise");
  }

  return { success: true };
}
