"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function deleteAccount() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: usersTableError } = await supabase
    .from("users")
    .delete()
    .eq("id", user.sub);

  if (usersTableError) {
    handleError(usersTableError, {
      message: "Error deleting user",
      route: "server-action: deleteAccount",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  const { error: authTableError } = await adminSupabase.auth.admin.deleteUser(
    user.sub
  );

  if (authTableError) {
    handleError(authTableError, {
      message: "Error deleting user",
      route: "server-action: deleteAccount",
      method: "direct",
    });
    throw new Error("Error deleting user");
  }

  return { success: true };
}
