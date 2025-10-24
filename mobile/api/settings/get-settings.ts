import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function fetchUserPreferences() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, display_name, weight_unit, profile_picture, role, push_enabled"
    )
    .eq("id", session.user.id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching user preferences",
      route: "/api/settings/get-settings",
      method: "GET",
    });
    return { error: true, message: "Error fetching user preferences" };
  }

  return data;
}
