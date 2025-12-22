import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveUserProfile(updates: {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error saving user profile",
      route: "/database/settings/save-user-profile",
      method: "POST",
    });
    throw new Error("Error saving user profile");
  }

  return true;
}
