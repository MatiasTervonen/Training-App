"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function validateUserName(name: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userName, error } = await supabase
    .from("users")
    .select("display_name")
    .ilike("display_name", name)
    .neq("id", user.sub) // Ensure we don't check against the current user's name
    .single();

  if (error && error.code !== "PGRST116") {
    handleError(error, {
      message: "Error validating user name",
      route: "/database/settings/validateUserName",
      method: "POST",
    });
    throw new Error("Error validating user name");
  }

  const isTaken = !!userName;

  return isTaken;
}
