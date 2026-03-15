import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function updatePushEnabledStatus(status: boolean) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_settings")
    .update({ push_enabled: status })
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error updating push enabled status",
      route: "features/push-notifications/updatePushEnabledStatus",
      method: "POST",
    });
    throw new Error("Error updating push enabled status");
  }

  return true;
}
