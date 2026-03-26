import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function fetchUserSettings() {
  const { data, error } = await supabase
    .from("user_settings")
    .select("push_enabled, gps_tracking_enabled, language, has_completed_onboarding, day_reset_hour")
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching user settings",
      route: "/database/settings/get-user-settings",
      method: "GET",
    });
    throw new Error("Error fetching user settings");
  }

  return data;
}
