import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type SaveDailyStepsParams = {
  date: string;
  timezone: string;
  steps: number;
};

export async function saveDailySteps({
  date,
  timezone,
  steps,
}: SaveDailyStepsParams) {
  const { error } = await supabase
    .from("steps_daily")
    .upsert(
      {
        day: date,
        timezone,
        steps,
      },
      { onConflict: "user_id,day" },
    )
    .select();

  if (error) {
    handleError(error, {
      message: "Error saving daily steps",
      route: "/api/daily-steps/save",
      method: "POST",
    });
    throw new Error(
      error.message || "Failed to save daily steps. Please try again.",
    );
  }

  return { success: true };
}
