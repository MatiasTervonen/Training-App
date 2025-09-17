import { createClient } from "@/utils/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Role = "user" | "admin" | "super_admin" | "guest" | null;

interface UserPreferences {
  display_name: string;
  weight_unit: string;
  profile_picture: string | null;
}

// Check if user is admin or super_admin

export async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, role: null };
  }

  return { user, role: profile.role };
}

// get user role and preferences

export async function getUserRoleAndPreferences(): Promise<{
  user: SupabaseUser | null;
  preferences: UserPreferences | null;
  role: Role;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, preferences: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture, role")
    .eq("id", user.id)
    .single();

  if (!profile || profileError) {
    return { user, preferences: null, role: null };
  }

  const { role, ...preferences } = profile;

  return { user, preferences, role: role as Role };
}
