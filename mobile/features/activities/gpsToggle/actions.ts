import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function updateGpsTrackingStatus(status: boolean) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const {  error } = await supabase
    .from("user_settings")
    .update({ gps_tracking_enabled: status })
    .eq("user_id", session.user.id)
  

  if (error) {
    handleError(error, {
      message: "Error updating Location tracking status",
      route: "/components/activities/actions.ts",
      method: "POST",
    });
    throw new Error("Error updating Location tracking status");
  }

  return true;
}


