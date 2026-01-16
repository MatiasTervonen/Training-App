import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export async function getTimer() {
  const { data: timers, error } = await supabase
    .from("timers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error getting timer",
      route: "/database/timer/get-timer",
      method: "GET",
    });
    throw new Error("Error getting timer");
  }

  return timers;
}
