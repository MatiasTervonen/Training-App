import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";

type UpdateTimerData = {
  id: string;
  title: string;
  durationInSeconds: number;
  notes: string;
};

export async function updateTimer({
  id,
  title,
  durationInSeconds,
  notes,
}: UpdateTimerData) {
  const supabase = createClient();

  const { error } = await supabase
    .from("timers")
    .update({
      title,
      time_seconds: durationInSeconds,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    handleError(error, {
      message: "Error updating timer",
      route: "/database/timer/update-timer",
      method: "PATCH",
    });
    throw new Error("Error updating timer");
  }

  return { success: true };
}
