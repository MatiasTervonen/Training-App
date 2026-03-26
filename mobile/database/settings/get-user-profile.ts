import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, weight_unit, distance_unit, profile_picture, role, height_cm, birth_date, gender")
    .eq("id", userId)
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
