import { handleError } from "@/utils/handleError";
import { createClient } from "@/utils/supabase/client";

export async function deleteTimer(timerId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("timers").delete().eq("id", timerId);

  if (error) {
    handleError(error, {
      message: "Error deleting timer",
      route: "/database/timer/delete-timer",
      method: "DELETE",
    });
    throw new Error("Error deleting timer");
  }

  return { success: true };
}
