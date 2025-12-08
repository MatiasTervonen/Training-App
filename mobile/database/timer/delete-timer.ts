import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteTimer(timerId: string) {


  const { error } = await supabase
    .from("timers")
    .delete()
    .eq("id", timerId)


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
