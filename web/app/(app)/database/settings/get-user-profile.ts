"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type Role = "user" | "admin" | "super_admin" | "guest";

export async function getUserProfile() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userProfile, error } = await supabase
    .from("users")
    .select("id, display_name, weight_unit, profile_picture, role")
    .eq("id", user.sub)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching user profile",
      route: "/database/settings/get-user-profile",
      method: "GET",
    });
    throw new Error("Error fetching user profile");
  }

  const { role, ...preferences } = userProfile;

  return { preferences, role: role as Role };
}
