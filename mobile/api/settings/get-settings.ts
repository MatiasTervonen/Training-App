import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export async function fetchUserPreferences(session: Session) {
  const { data, error } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  return data;
}
