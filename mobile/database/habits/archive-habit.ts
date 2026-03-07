import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function archiveHabit(habitId: string) {
  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", habitId);

  if (error) {
    handleError(error, {
      message: "Error archiving habit",
      route: "/database/habits/archive-habit",
      method: "PATCH",
    });
    throw new Error("Error archiving habit");
  }
}
