"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type UserPreferences = {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
};

type Role = "user" | "admin" | "super_admin" | "guest" | null;

export async function saveSettings({
  display_name,
  weight_unit,
  profile_picture,
}: UserPreferences) {
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

// get user role and preferences

export async function getUserRoleAndPreferences(): Promise<{
  preferences: UserPreferences | null;
  role: Role;
}> {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", user.sub)
    .single();

  if (!profile || profileError) {
    console.log("profile error", profileError);
    handleError(profileError, {
      message: "Error fetching user preferences",
      method: "GET",
    });
    throw new Error("Error fetching user preferences");
  }

  const { role, ...preferences } = profile;

  return { preferences, role: role as Role };
}

// check if username is taken

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
