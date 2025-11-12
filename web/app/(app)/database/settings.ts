"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type SaveSettingsProps = {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
};

export async function saveSettings({
  display_name,
  weight_unit,
  profile_picture,
}: SaveSettingsProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name, weight_unit, profile_picture })
    .eq("id", user.sub);

  if (error) {
    if (
      error.message ===
      'duplicate key value violates unique constraint "users_display_name_lower_idx"'
    ) {
      throw new Error("Username is already taken!");
    }
    handleError(error, {
      message: "Error updating user settings",
      route: "server-action: saveSettings",
      method: "direct",
    });
    throw new Error("Error updating user settings");
  }

  return { success: true };
}
