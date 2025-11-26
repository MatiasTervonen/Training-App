import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function DeleteTimer(timerId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("timers")
    .delete()
    .eq("id", timerId)
    .eq("user_id", session.user.id)

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
