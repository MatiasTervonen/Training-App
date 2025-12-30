"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getUserCount() {
  const supabase = await createClient();

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

  const { data: userCount, error: countError } = await supabase
    .from("analytics_counts")
    .select("count")
    .eq("id", "users")
    .single();

  if (countError || !userCount) {
    console.log("error", countError);
    handleError(countError, {
      message: "Error fetching user count",
      route: "server_action: getUserCount",
      method: "direct",
    });
    throw new Error("Error fetching user count");
  }

  return userCount;
}
