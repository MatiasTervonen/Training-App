"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export async function getUserSettings() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("push_enabled, language")
    .eq("user_id", user.sub)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching user settings",
      route: "/database/settings/get-user-settings",
      method: "GET",
    });
    throw new Error("Error fetching user settings");
  }

  return settings;
}
