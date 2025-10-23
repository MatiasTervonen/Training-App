import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

type TimerData = {
  title: string;
  durationInSeconds: number;
  notes: string;
};

export default async function saveTimer({
  title,
  durationInSeconds,
  notes,
}: TimerData) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { error } = await supabase
    .from("timers")
    .insert({
      title,
      time_seconds: durationInSeconds,
      notes,
      user_id: session.user.id,
    })
    .select()
    .single();

  if (error) {
    handleError(error, {
      message: "Error saving timer",
      route: "/api/timer/save-timer",
      method: "POST",
    });
    throw new Error("Error saving timer");
  }

  return { success: true };
}
