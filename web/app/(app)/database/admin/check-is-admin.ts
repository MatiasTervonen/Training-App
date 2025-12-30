"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function checkAdmin() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return { user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (profileError || !profile) {
    handleError(profileError, {
      message: "Error fetching user role",
      method: "GET",
    });
    return { user: null, role: null };
  }

  return { user, role: profile.role };
}
