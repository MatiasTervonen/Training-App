"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleError } from "@/app/(app)/utils/handleError";

type PromoteUser = {
  userRole: string;
  user_id: string;
};

export async function promoteUser({ userRole, user_id }: PromoteUser) {
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

  const { error: adminError } = await adminSupabase.auth.admin.updateUserById(
    user_id,
    {
      app_metadata: { role: userRole },
    }
  );

  if (adminError) {
    handleError(adminError, {
      message: "Error promoting user",
      route: "server_action: promoteUser auth table",
      method: "direct",
    });
    throw new Error("Error promoting user");
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({ role: userRole })
    .eq("id", user_id);

  if (dbError) {
    handleError(dbError, {
      message: "Error updating user role in database",
      route: "server_action: promoteUser users table",
      method: "direct",
    });
    throw new Error("Error updating user role in database");
  }

  return { success: true };
}
