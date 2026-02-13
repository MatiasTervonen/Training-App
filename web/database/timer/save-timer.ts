import { handleError } from "@/utils/handleError";
import { createClient } from "@/utils/supabase/client";

type TimerData = {
  title: string;
  durationInSeconds: number;
  notes: string;
};

export async function saveTimer({
  title,
  durationInSeconds,
  notes,
}: TimerData) {
  const supabase = createClient();

  const { error } = await supabase
    .from("timers")
    .insert({
      title,
      time_seconds: durationInSeconds,
      notes,
    })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving timer",
      route: "/database/timer/save-timer",
      method: "POST",
    });
    throw new Error("Error saving timer");
  }

  return { success: true };
}
