import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveSettings(updates: {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error saving user preferences",
      route: "/api/settings/save-settings",
      method: "POST",
    });
    return { error: true, message: "Error saving user preferences" };
  }

  return true;
}
