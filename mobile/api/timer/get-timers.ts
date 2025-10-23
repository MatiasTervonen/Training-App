import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function GetTimer() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { data: timers, error } = await supabase
    .from("timers")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, {
      message: "Error getting timer",
      route: "/api/timer/get-timer",
      method: "GET",
    });
    throw new Error("Error getting timer");
  }

  return timers;
}
