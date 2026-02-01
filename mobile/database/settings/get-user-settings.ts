import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function fetchUserSettings() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("push_enabled, gps_tracking_enabled, language")
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
