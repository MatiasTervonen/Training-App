"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/utils/handleError";

export async function deleteUser(user_id: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if the user has admin privileges
  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(user_id);

  if (error) {
    handleError(error, {
      message: "Error deleting user from auth table",
      route: "server-actions: deleteUser",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  return { success: true };
}
