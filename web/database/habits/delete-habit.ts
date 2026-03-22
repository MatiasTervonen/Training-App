import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteHabit(habitId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("habits")
    .delete()
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
