import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteHabit(habitId: string) {
  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", habitId);

  if (error) {
    handleError(error, {
      message: "Error deleting habit",
      route: "/database/habits/delete-habit",
      method: "DELETE",
    });
    throw new Error("Error deleting habit");
  }
}
