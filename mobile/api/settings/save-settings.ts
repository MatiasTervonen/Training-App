import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export async function saveSettings(
  updates: {
    display_name: string;
    weight_unit: string;
    profile_picture: string | null;
  },
    session: Session
) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id);

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  return true;
}
