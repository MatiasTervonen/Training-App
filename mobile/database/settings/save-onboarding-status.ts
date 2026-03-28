import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveOnboardingStatus(completed: boolean) {
  const { error } = await supabase
    .from("user_settings")
    .update({ has_completed_onboarding: completed });

  if (error) {
    handleError(error, {
      message: "Error updating onboarding status",
      route: "/database/settings/save-onboarding-status.ts",
      method: "POST",
    });
    throw new Error("Error updating onboarding status");
  }

  return true;
}
