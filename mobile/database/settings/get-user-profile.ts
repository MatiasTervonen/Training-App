import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function fetchUserProfile() {
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, weight_unit, profile_picture, role")
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching user profile",
      route: "/database/settings/get-user-profile",
      method: "GET",
    });
    throw new Error("Error fetching user profile");
  }

  return data;
}
