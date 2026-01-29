import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

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
