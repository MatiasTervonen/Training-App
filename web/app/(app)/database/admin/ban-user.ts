"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type BanUser = {
  user_id: string;
  duration: string;
  reason: string;
};

export async function banUser({ user_id, duration, reason }: BanUser) {
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

  if (duration === "unban") {
    // Unban the user
    const { error: unbanError } = await supabase
      .from("users")
      .update({
        banned_until: null,
        ban_reason: null,
      })
      .eq("id", user_id);

    if (unbanError) {
      handleError(unbanError, {
        message: "Error unbanning user",
        route: "server-action: banUser-Admin",
        method: "direct",
      });
      throw new Error("Error unbanning user");
    }

    return { success: true };
  }

  let bannedUntil = null;
  if (duration !== "permanent") {
    const hours = parseInt(duration.replace("h", ""), 10);
    if (isNaN(hours)) {
      throw new Error("Invalid duration format");
    }
    bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  } else {
    bannedUntil = new Date(Date.now() + 876600 * 60 * 60 * 1000);
  }

  const { error: dbError } = await supabase
    .from("users")
    .update({
      banned_until: bannedUntil.toISOString(),
      ban_reason: reason || null,
    })
    .eq("id", user_id);

  if (dbError) {
    handleError(dbError, {
      message: "Error banning user",
      route: "server-action: banUser-Admin",
      method: "direct",
    });
    throw new Error("Error banning user");
  }

  return { success: true };
}
