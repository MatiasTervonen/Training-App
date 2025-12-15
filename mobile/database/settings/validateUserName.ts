import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function validateUserName(name: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("users")
    .select("display_name")
    .ilike("display_name", name)
    .neq("id", session.user.id) // Ensure we don't check against the current user's name
    .single();

  if (error && error.code !== "PGRST116") {
    handleError(error, {
      message: "Error validating user name",
      route: "/database/settings/validateUserName",
      method: "POST",
    });
    throw new Error("Error validating user name");
  }

  const isTaken = !!data;

  return isTaken;
}
