import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function saveUserProfile(updates: {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}) {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.sub);

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
