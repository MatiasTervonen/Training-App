import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveOnboardingStatus(completed: boolean) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_settings")
    .update({ has_completed_onboarding: completed })
    .eq("user_id", session.user.id);

  if (error) {
    console.error(error);
    handleError(error, {
      message: "Error updating onboarding status",
      route: "/database/settings/save-onboarding-status.ts",
      method: "POST",
    });
    throw new Error("Error updating onboarding status");
  }

  return true;
}
