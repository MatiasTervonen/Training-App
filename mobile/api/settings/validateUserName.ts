import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export async function validateUserName(name: string, session: Session) {
  const { data, error } = await supabase
    .from("users")
    .select("display_name")
    .ilike("display_name", name)
    .neq("id", session.user.id) // Ensure we don't check against the current user's name
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  const isTaken = !!data;

  return isTaken;
}
